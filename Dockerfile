# --- Frontend build ---
FROM node:20-slim AS frontend-build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# --- Backend runtime ---
FROM node:20-slim

ENV NODE_ENV=production \
    PORT=8080 \
    SKIP_FIRESTORE_CACHE=true

WORKDIR /app

# Install backend dependencies
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm ci --omit=dev

# Copy backend source
COPY backend/. ./backend

# Copy frontend build output
COPY --from=frontend-build /app/dist ./public

WORKDIR /app/backend

# Use existing non-root 'node' user
USER node

EXPOSE 8080
STOPSIGNAL SIGTERM

CMD ["node", "app.js"]
