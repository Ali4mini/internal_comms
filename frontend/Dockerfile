# Stage 1: Build stage
FROM docker.arvancloud.ir/node:22-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
# Doing this before copying the full source allows Docker to cache layers
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .



EXPOSE 5173

CMD ["npm", "run", "dev"]
