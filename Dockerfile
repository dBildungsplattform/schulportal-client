ARG BASE_IMAGE_BUILDER=node:22.14.0-alpine3.21
ARG BASE_IMAGE=nginx:1.26.3-alpine

# Build Stage
FROM $BASE_IMAGE_BUILDER AS build

RUN apk add openjdk17-jre>=17.0.10_p7-r0

WORKDIR /app
COPY tsconfig*.json ./
COPY package*.json ./
COPY vite*.ts ./
COPY index.html ./
COPY env*.ts ./
COPY src/ src/
COPY test/ test/
COPY public/ public/

RUN npm ci
RUN npm run build

# Deployment Stage
FROM $BASE_IMAGE AS deployment

# Fix Trivy Warnings
# CVE-2025-24928, CVE-2024-8176, CVE-2025-24855, CVE-2025-31115, CVE-2025-32415
RUN apk --no-cache add "libexpat>=2.7.0-r0" "libxml2>=2.12.10-r0" "libxslt>=1.1.39-r2" "xz-libs>=5.6.2-r1"

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