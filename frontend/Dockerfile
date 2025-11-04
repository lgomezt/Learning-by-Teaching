# /frontend/Dockerfile

# --- Stage 1: The "Builder" ---
FROM node:alpine AS builder
WORKDIR /app

# Copy package files from the frontend subdir
COPY frontend/package*.json ./
COPY frontend/tsconfig*.json ./

# RUN npm install
RUN npm ci

# Copy the rest of the frontend source code from the frontend subdir
COPY frontend/ .

ARG VITE_API_URL
ARG VITE_AUTH0_DOMAIN
ARG VITE_AUTH0_CLIENT_ID
ARG VITE_AUTH0_AUDIENCE

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_AUTH0_DOMAIN=$VITE_AUTH0_DOMAIN
ENV VITE_AUTH0_CLIENT_ID=$VITE_AUTH0_CLIENT_ID
ENV VITE_AUTH0_AUDIENCE=$VITE_AUTH0_AUDIENCE

RUN npm run build

# --- Stage 2: The "Server" ---
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=builder /app/dist .

# Copy the Nginx config from the frontend subdir
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80