ARG BASE_IMAGE_BUILDER=node:21.6.0-alpine3.18
ARG BASE_IMAGE=nginx:1.25-alpine

# Build Stage
FROM $BASE_IMAGE_BUILDER as build


RUN apk add openjdk17-jre=17.0.10_p7-r0


WORKDIR /app

COPY tsconfig*.json ./
COPY package*.json ./
COPY vite*.ts ./
COPY index.html ./
COPY env*.ts ./
COPY src/ src/
COPY public/ public/


RUN npm install
RUN npm run build

# Deployment Stage
FROM $BASE_IMAGE as deployment


RUN addgroup -S nginxgroup && adduser -S nginxuser -G nginxgroup


COPY --from=build /app/dist/ /usr/share/nginx/html/


RUN rm /etc/nginx/conf.d/default.conf
COPY nginx-vue.conf /etc/nginx/conf.d/


RUN mkdir -p /var/cache/nginx/client_temp && \
    chown -R nginxuser:nginxgroup /var/cache/nginx && \
    chmod -R 755 /var/cache/nginx

# Switch to non-root user for running Nginx
USER nginxuser

# Expose the port Nginx is listening on
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
