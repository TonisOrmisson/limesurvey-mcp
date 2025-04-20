FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# We no longer copy source files since they will be mounted as a volume
# The build step is now performed as part of the startup command

# Set environment to production
ENV NODE_ENV=production

# Expose the port set in the .env file (default: 3000)
EXPOSE 3000

# Build TypeScript and start the application
CMD ["sh", "-c", "npm run build && npm start"]