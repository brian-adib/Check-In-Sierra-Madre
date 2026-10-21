# Etapa 1: Construcción (Instala dependencias de producción)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

# Etapa 2: Imagen final (Ligera y segura)
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copiar dependencias y código desde el builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./

# Exponer el puerto
EXPOSE 3000

# Healthcheck exigido por el brief (verifica que /health responda 200)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Arrancar: Primero migra la DB, luego inicia el servidor
CMD ["sh", "-c", "npm run migrate && npm start"]