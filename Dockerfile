# Etapa 1: Construcción (Usamos Debian Slim en lugar de Alpine)
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

# Etapa 2: Imagen final (Debian Slim)
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

# Copiar dependencias y código desde el builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./

# Exponer el puerto
EXPOSE 3000

# Healthcheck exigido por el brief
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Arrancar: Primero migra la DB, luego inicia el servidor
CMD ["sh", "-c", "npm run migrate && npm start"]