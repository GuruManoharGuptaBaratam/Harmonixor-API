FROM node:18-bullseye


RUN apt-get update && apt-get install -y \
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


RUN pip3 install yt-dlp && ln -s /usr/local/bin/yt-dlp /usr/bin/yt-dlp


WORKDIR /app


COPY package*.json ./


RUN npm install


RUN npx playwright install --with-deps chromium


COPY . .


EXPOSE 5000


CMD ["npm", "start"]

