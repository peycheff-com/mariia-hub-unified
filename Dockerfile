# Multi-stage Dockerfile for optimized React/Vite application
# ================================================
# Stage 1: Builder
# ================================================
FROM node:20-alpine AS builder

# Set build arguments
ARG BUILD_DATE
ARG BUILD_VERSION
ARG VITE_BUILD_TARGET
ARG VITE_BUILD_SHA
ARG VITE_BUILD_TIME
ARG VITE_APP_ENV

# Set environment variables for build
ENV NODE_ENV=production
ENV VITE_BUILD_TARGET=${VITE_BUILD_TARGET:-production}
ENV VITE_BUILD_SHA=${VITE_BUILD_SHA}
ENV VITE_BUILD_DATE=${BUILD_DATE}
ENV VITE_BUILD_TIME=${BUILD_TIME}
ENV VITE_APP_ENV=${VITE_APP_ENV:-production}

# Use non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Install pnpm for faster installs
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json pnpm-lock.yaml* ./

# Install dependencies with optimized caching
# Use ci for clean installs in production
RUN if [ -f pnpm-lock.yaml ]; then \
        pnpm install --frozen-lockfile --prod=false; \
    else \
        npm ci --only=production=false; \
    fi

# Copy source code
COPY . .

# Build the application
RUN if [ -f pnpm-lock.yaml ]; then \
        pnpm run build:production; \
    else \
        npm run build:production; \
    fi

# Run tests if in CI environment
ARG CI=false
RUN if [ "$CI" = "true" ]; then \
        if [ -f pnpm-lock.yaml ]; then \
            pnpm run test:ci; \
        else \
            npm run test:ci; \
        fi \
    fi

# Cleanup development dependencies
RUN if [ -f pnpm-lock.yaml ]; then \
        pnpm prune --prod; \
    else \
        npm prune --production; \
    fi

# ================================================
# Stage 2: Production Runtime
# ================================================
FROM nginx:alpine AS production

# Install necessary tools
RUN apk add --no-cache \
    curl \
    jq \
    tzdata \
    && rm -rf /var/cache/apk/*

# Set timezone
ENV TZ=Europe/Warsaw

# Create non-root user
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

# Copy custom nginx configuration
COPY infrastructure/nginx/nginx.conf /etc/nginx/nginx.conf
COPY infrastructure/nginx/mime.types /etc/nginx/mime.types

# Create nginx cache and log directories with proper permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R appuser:appgroup /var/cache/nginx /var/log/nginx /var/run

# Copy built application from builder stage
COPY --from=builder --chown=appuser:appgroup /app/dist /usr/share/nginx/html

# Copy health check script
COPY infrastructure/docker/healthcheck.sh /usr/local/bin/healthcheck.sh
RUN chmod +x /usr/local/bin/healthcheck.sh

# Copy startup script
COPY infrastructure/docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Expose port
EXPOSE 8080

# Set environment variables
ENV NGINX_HOST=0.0.0.0
ENV NGINX_PORT=8080
ENV NODE_ENV=production

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Default command
CMD ["nginx", "-g", "daemon off;"]

# Labels for metadata
LABEL maintainer="ivanborysevych"
LABEL version="${BUILD_VERSION:-latest}"
LABEL build.date="${BUILD_DATE}"
LABEL description="Mariia Hub - Beauty and Fitness Booking Platform"
LABEL org.opencontainers.image.source="https://github.com/ivanborysevych/mariia-hub-unified"
LABEL org.opencontainers.image.licenses="MIT"

# ================================================
# Stage 3: Development Runtime (optional)
# ================================================
FROM builder AS development

# Set development environment
ENV NODE_ENV=development
ENV VITE_APP_ENV=development

# Install development server dependencies
RUN if [ -f pnpm-lock.yaml ]; then \
        pnpm install; \
    else \
        npm install; \
    fi

# Expose development port
EXPOSE 8080

# Switch back to root user for development
USER root

# Development entrypoint
CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080"]

# ================================================
# Stage 4: Testing (optional)
# ================================================
FROM builder AS testing

# Set testing environment
ENV NODE_ENV=test
ENV CI=true

# Install test dependencies
RUN if [ -f pnpm-lock.yaml ]; then \
        pnpm install; \
    else \
        npm install; \
    fi

# Run all tests
RUN if [ -f pnpm-lock.yaml ]; then \
        pnpm run test:coverage && \
        pnpm run test:e2e; \
    else \
        npm run test:coverage && \
        npm run test:e2e; \
    fi

# Test command
CMD ["echo", "All tests completed"]