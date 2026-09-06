FROM node:22-bookworm

# Install Chromium
RUN apt-get update && \
    apt-get install -y --no-install-recommends chromium && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install dependencies, including devDependencies
RUN npm ci --include=dev

# Copy application source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Tell Puppeteer / WhatsApp Web.js where Chromium is
ENV CHROME_PATH=/usr/bin/chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Render provides PORT at runtime
EXPOSE 4000

# Start application
CMD ["npm", "start"]