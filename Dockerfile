# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine AS runner

# Install additional tools for monitoring
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy custom nginx configuration
COPY infra/nginx/nginx.conf /etc/nginx/nginx.conf
COPY infra/nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist /usr/share/nginx/html

# Copy health check script
COPY infra/docker/healthcheck.sh /usr/local/bin/healthcheck.sh
RUN chmod +x /usr/local/bin/healthcheck.sh

# Create logs directory
RUN mkdir -p /var/log/nginx && \
    chown -R nodejs:nodejs /var/log/nginx

# Expose ports for HTTP and HTTPS
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh

# Start nginx
CMD ["nginx", "-g", "daemon off;"]