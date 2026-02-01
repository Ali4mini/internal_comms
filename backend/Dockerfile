FROM docker.arvancloud.ir/node:22-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy everything else
COPY . .

EXPOSE 3000

# Use "dev" for local development with hot-reload
CMD ["npm", "run", "dev"]
