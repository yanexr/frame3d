FROM node:20-slim

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production

# Install necessary dependencies for Chromium
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    ca-certificates \
    chromium \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxshmfence1 \
    xdg-utils \
    && apt-get purge -y --auto-remove \
    && rm -rf /var/lib/apt/lists/* /usr/share/man/* /usr/share/doc/* /usr/share/locale/*

WORKDIR /usr/src/app

# Create a non-root user and group
RUN groupadd --system nodejs && useradd --system --gid nodejs --create-home nodejs

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production --no-audit --no-fund

# Copy the pre-built application code
COPY dist/src ./dist/src

# Change ownership of the app directory to nodejs user
RUN chown -R nodejs:nodejs /usr/src/app

# Switch to non-root user for running the application
USER nodejs

# Expose the application port
EXPOSE 8080

# Start the application
CMD ["node", "dist/src/index.js"]