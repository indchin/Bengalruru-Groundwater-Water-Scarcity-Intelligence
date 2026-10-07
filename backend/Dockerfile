FROM node:22-alpine

WORKDIR /app

# Install deps first for better layer caching.
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY . .

# better-sqlite3 needs build tools at install time on some platforms; on
# Alpine with npm's prebuilt binaries this usually isn't needed, but if a
# fresh `npm ci` ever fails here on a new arch, uncomment:
# RUN apk add --no-cache python3 make g++ && npm rebuild better-sqlite3

RUN mkdir -p /app/data
VOLUME ["/app/data"]

ENV NODE_ENV=production
ENV PORT=4000
ENV DB_PATH=/app/data/app.db
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://localhost:'+process.env.PORT+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
