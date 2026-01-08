FROM node:20-alpine

ENV NODE_ENV=production \
    PORT=8080

WORKDIR /app

# Install dependencies from backend manifest
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm ci --omit=dev --ignore-scripts

# Copy backend source
COPY backend/. ./backend

# Switch workdir to backend app
WORKDIR /app/backend

# Non-root user
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 8080
STOPSIGNAL SIGTERM

CMD ["node", "app.js"]
