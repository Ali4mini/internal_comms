# Filename: Dockerfile

# Stage 1: Build
FROM docker.arvancloud.ir/node:22-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
# Install all dependencies (including devDependencies for TypeScript build)
RUN npm ci

# Copy source code
COPY . .

# Build the project (assuming you have a "build" script in package.json)
# If using pure JS, you can skip this, but Drizzle/Fastify usually implies TS.
RUN npm run build

# Stage 2: Production/Runtime
FROM node:22-alpine

WORKDIR /app

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Expose Fastify port
EXPOSE 3000

# Start command (adjust path to your compiled entry point)
CMD ["node", "dist/index.js"]
