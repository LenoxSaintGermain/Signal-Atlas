FROM node:20-slim

ENV NODE_ENV=production \
    PORT=8080

WORKDIR /app

# Install dependencies from backend manifest
COPY backend/package.json backend/package-lock.json* ./backend/
# Remove --ignore-scripts to allow gRPC/Firestore binary download
RUN cd backend && npm ci --omit=dev

# Copy backend source
COPY backend/. ./backend

# Switch workdir to backend app
WORKDIR /app/backend

# Use existing non-root 'node' user
USER node

EXPOSE 8080
STOPSIGNAL SIGTERM

CMD ["node", "app.js"]
