type AnyEnv = Record<string, string | undefined>;

const hasImportMetaEnv = (): boolean => {
  try {
    // In Vite builds import.meta.env is available at compile time
    return typeof import.meta !== 'undefined' && typeof (import.meta as any).env !== 'undefined';
  } catch {
    return false;
  }
};

const readFromImportMeta = (key: string): string | undefined => {
  if (!hasImportMetaEnv()) return undefined;
  const env = (import.meta as any).env as AnyEnv;
  const value = env?.[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
};

const hasProcessEnv = (): boolean => {
  return typeof process !== 'undefined' && typeof process.env !== 'undefined';
};

const readFromProcessEnv = (key: string): string | undefined => {
  if (!hasProcessEnv()) return undefined;
  const value = (process.env as AnyEnv)?.[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
};

/**
 * Reads an environment variable from either import.meta.env (client) or process.env (server).
 * Supports optional fallback keys to ease migration from different naming conventions.
 */
export const getEnvVar = (primaryKey: string, fallbacks: string[] = []): string | undefined => {
  const keys = [primaryKey, ...fallbacks];

  for (const key of keys) {
    const value = readFromImportMeta(key) ?? readFromProcessEnv(key);
    if (typeof value !== 'undefined') {
      return value;
    }
  }

  return undefined;
};

/**
 * Reads a required environment variable. Throws if no value can be resolved.
 */
export const getRequiredEnvVar = (
  primaryKey: string,
  fallbacks: string[] = [],
  errorMessage?: string
): string => {
  const value = getEnvVar(primaryKey, fallbacks);

  if (typeof value === 'undefined') {
    const message = errorMessage ?? `Missing required environment variable: ${primaryKey}`;
    throw new Error(message);
  }

  return value;
};

/**
 * Convenience helper for optional boolean flags.
 */
export const getBooleanEnvVar = (
  primaryKey: string,
  fallbacks: string[] = [],
  defaultValue = false
): boolean => {
  const value = getEnvVar(primaryKey, fallbacks);
  if (typeof value === 'undefined') return defaultValue;

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};
