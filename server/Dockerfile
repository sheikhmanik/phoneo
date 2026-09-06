FROM node:22-bookworm

# Install Chromium and required dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install --include=dev

COPY . .

RUN npm run build

ENV CHROME_PATH=/usr/bin/chromium

EXPOSE 4000

CMD ["npm", "start"]