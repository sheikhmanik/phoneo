FROM node:22-bookworm

WORKDIR /app

COPY package*.json ./

RUN npm install

# Install Chromium

# RUN apt-get update && \

#     apt-get install -y chromium && \

#     rm -rf /var/lib/apt/lists/*

RUN apt-get update && \
    apt-get install -y \
      chromium \
      fonts-liberation \
      libasound2 \
      libatk-bridge2.0-0 \
      libatk1.0-0 \
      libcups2 \
      libdrm2 \
      libgbm1 \
      libgtk-3-0 \
      libnspr4 \
      libnss3 \
      libpango-1.0-0 \
      libx11-xcb1 \
      libxcomposite1 \
      libxdamage1 \
      libxfixes3 \
      libxrandr2 \
      libxshmfence1 \
      xdg-utils \
      --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]

