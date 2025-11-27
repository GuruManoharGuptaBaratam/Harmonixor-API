FROM node:18-bullseye

# Install all dependencies + ffmpeg in ONE layer
RUN apt-get update \
    && apt-get install -y \
       ffmpeg \
       libatk1.0-0 \
       libatk-bridge2.0-0 \
       libatspi2.0-0 \
       libxfixes3 \
       libxkbcommon0 \
       libcups2 \
       libnss3 \
       libxcomposite1 \
       libxdamage1 \
       libxrandr2 \
       libgbm1 \
       libasound2 \
       libpangocairo-1.0-0 \
       libxshmfence1 \
       python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN pip3 install yt-dlp
RUN ln -s /usr/local/bin/yt-dlp /usr/bin/yt-dlp

# Install Playwright
RUN npm install -g playwright
RUN playwright install chromium

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5432

CMD ["npm", "start"]
