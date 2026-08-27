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

# node:20-alpine ships no curl, and Node 20 has a global fetch.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>r.json()).then(b=>process.exit(b.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "backend/server.js"]
