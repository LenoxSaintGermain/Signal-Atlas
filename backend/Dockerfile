FROM node:20-alpine

ENV NODE_ENV=production \
    PORT=8080

WORKDIR /app

# Install dependencies with clean, reproducible builds
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts

# Copy source
COPY . .

# Create non-root user
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 8080

# Graceful stop
STOPSIGNAL SIGTERM

CMD ["node", "app.js"]
