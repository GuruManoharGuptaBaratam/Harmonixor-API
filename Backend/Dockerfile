FROM node:18-bullseye


RUN apt-get update && apt-get install -y \
    libatk1.0-0 \
    libcups2 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    python3 python3-pip \
    libatk1.0-0 libcups2 libnss3 libxcomposite1 libxdamage1 \
    libxrandr2 libgbm1 libasound2 libpangocairo-1.0-0 \
    libpangocairo-1.0-0 \
    libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install yt-dlp

RUN npm install -g playwright && playwright install chromium


WORKDIR /app


COPY package*.json ./


RUN npm install


COPY . .


EXPOSE 5432


CMD ["npm", "start"]
