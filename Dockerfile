FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY backend ./backend
COPY frontend ./frontend
COPY shared ./shared

USER node

EXPOSE 3000

CMD ["node", "backend/server.js"]
