FROM node:20-alpine AS builder

WORKDIR /app

# Set dummy DATABASE_URL for build time (prisma generate doesn't need real DB)
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dummy?schema=public"

COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma

RUN npm ci

COPY . .

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY scripts ./scripts

# Set dummy DATABASE_URL for build time (prisma generate doesn't need real DB)
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dummy?schema=public"

RUN npm ci --only=production
RUN npx prisma generate

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

RUN chmod +x ./scripts/startup.sh

EXPOSE 5000

CMD ["sh", "./scripts/startup.sh"]
