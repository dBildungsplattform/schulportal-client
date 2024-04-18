ARG BASE_IMAGE_BUILDER=node:20.11.1-alpine3.19
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

RUN npm ci
RUN npm run build

# Deployment Stage
FROM $BASE_IMAGE as deployment
# Fix Trivy Warnings CVE-2024-2511
RUN apk --no-cache add "libssl3>=3.1.4-r6" "libcrypto3>=3.1.4-r6"

COPY --from=build /app/dist/ /usr/share/nginx/html/

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx-vue.conf /etc/nginx/conf.d/

RUN chown -R nginx:nginx /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chmod -R 644 /etc/nginx/conf.d/*

RUN touch /run/nginx.pid \
    && chown -R nginx:nginx /run/nginx.pid /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html

USER nginx
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]