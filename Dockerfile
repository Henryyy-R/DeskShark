FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# Install backend dependencies first, so this layer is reused
# until package.json or package-lock.json changes.
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Application code. The backend/frontend layout must stay the same,
# because server.js serves ../frontend.
COPY backend ./backend
COPY frontend ./frontend

# Uploads folder, owned by the unprivileged user the app runs as.
RUN mkdir -p /app/backend/uploads && chown -R node:node /app

USER node
WORKDIR /app/backend

EXPOSE 5000
CMD ["node", "server.js"]