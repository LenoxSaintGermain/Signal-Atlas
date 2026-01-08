FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy source
COPY . .

EXPOSE 8080
CMD ["npm", "start"]