FROM node:22-bookworm

WORKDIR /app

COPY package*.json ./

RUN npm install

# Install Chromium

RUN apt-get update && \

    apt-get install -y chromium && \

    rm -rf /var/lib/apt/lists/*

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]

