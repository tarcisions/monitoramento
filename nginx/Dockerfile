# Etapa 1: Build do frontend
FROM node:18-alpine as builder

WORKDIR /app

# Instala as dependências e faz o build
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

COPY frontend/ . 
RUN npm run build

# Etapa 2: Nginx com proxy reverso e frontend
FROM nginx:alpine

# Remove configuração default do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia a configuração personalizada
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copia os arquivos estáticos do frontend build para o Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
