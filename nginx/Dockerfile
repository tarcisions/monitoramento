# Stage 1: Build do frontend (React)
FROM node:18-alpine as frontend-builder

WORKDIR /app

# Copia package.json e package-lock.json
COPY frontend/package*.json ./

RUN npm install

# Copia todo o código fonte do React
COPY frontend/ ./

# Build do frontend
RUN npm run build

# Stage 2: Servir com Nginx
FROM nginx:alpine

# Remove configuração default do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia configuração personalizada do Nginx (se houver)
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copia o build do React para o Nginx
COPY --from=frontend-builder /app/build /usr/share/nginx/html

# Expõe porta 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
