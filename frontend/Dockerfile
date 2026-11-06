FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN mkdir -p /var/cache/nginx /var/log/nginx /run/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d /run/nginx && \
    sed -i 's|pid.*;|pid /run/nginx/nginx.pid;|' /etc/nginx/nginx.conf && \
    sed -i 's|user .*;|user nginx;|' /etc/nginx/nginx.conf
EXPOSE 8080
USER nginx
ENTRYPOINT []
CMD ["nginx", "-g", "daemon off;"]
