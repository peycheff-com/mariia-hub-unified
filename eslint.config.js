import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import react from "eslint-plugin-react";
import jsxA11y from "eslint-plugin-jsx-a11y";
import security from "eslint-plugin-security";
import importPlugin from "eslint-plugin-import";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "build", "node_modules", "coverage", "*.config.js", "*.config.ts"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "react": react,
      "jsx-a11y": jsxA11y,
      "security": security,
      "import": importPlugin,
    },
    settings: {
      react: {
        version: "detect",
      },
      "import/resolver": {
        typescript: true,
        node: true,
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // TypeScript rules
      "@typescript-eslint/no-unused-vars": ["error", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",

      // React rules
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "warn",
      "react/jsx-fragments": ["error", "syntax"],
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-key": "error",
      "react/self-closing-comp": "error",

      // Accessibility rules (jsx-a11y)
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/img-redundant-alt": "error",
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/label-has-associated-control": "error",
      "jsx-a11y/media-has-caption": "warn",
      "jsx-a11y/mouse-events-have-key-events": "warn",
      "jsx-a11y/no-autofocus": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/role-has-required-aria-props": "error",

      // Security rules
      "security/detect-eval-with-expression": "error",
      "security/detect-non-literal-fs-filename": "warn",
      "security/detect-non-literal-regexp": "warn",
      "security/detect-object-injection": "warn",
      "security/detect-possible-timing-attacks": "warn",
      "security/detect-pseudoRandomBytes": "warn",

      // Import rules
      "import/order": ["error", {
        "groups": [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
          "object",
          "type"
        ],
        "newlines-between": "always",
      }],
      "import/no-duplicates": "error",
    },
  },
  // Scripts and tests specific overrides to reduce noise and allow pragmatic patterns
  {
    files: ["scripts/**/*.{ts,tsx}", "**/*.scripts.ts"],
    rules: {
      // Scripts run in trusted environments; relax aggressive security rules here
      "security/detect-object-injection": "off",
      "security/detect-non-literal-fs-filename": "off",
      // Allow pragmatic typing in scripts
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["tests/**/*.{ts,tsx}", "**/*.spec.{ts,tsx}", "**/*.test.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        // Playwright globals
        page: "readonly",
        context: "readonly",
      },
    },
    rules: {
      // Be lenient with unused vars in tests; prefer prefixing with _ when convenient
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
      // React fast-refresh rule is irrelevant in test files
      "react-refresh/only-export-components": "off",
      // Object injection warnings are noisy in mocks/fixtures
      "security/detect-object-injection": "off",
    },
  },
);
