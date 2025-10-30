# /frontend/Dockerfile

# --- Stage 1: The "Builder" ---
FROM node:alpine AS builder
WORKDIR /app

# Copy package files from the frontend subdir
COPY frontend/package*.json ./
COPY frontend/tsconfig*.json ./

RUN npm install

# Copy the rest of the frontend source code from the frontend subdir
COPY frontend/ .

RUN npm run build

# --- Stage 2: The "Server" ---
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=builder /app/dist .

# Copy the Nginx config from the frontend subdir
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80