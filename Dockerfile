ARG BASE_IMAGE_BUILDER=node:20.18.1-alpine3.21
ARG BASE_IMAGE=nginx:1.26-alpine

# Build Stage
FROM $BASE_IMAGE_BUILDER as build

# Install Java (if needed for your build process)
RUN apk add openjdk17-jre>=17.0.10_p7-r0

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY tsconfig*.json ./
COPY package*.json ./
COPY vite*.ts ./
COPY index.html ./
COPY env*.ts ./
COPY src/ src/
COPY public/ public/

# Build the application
RUN npm run build

# Deployment Stage
FROM $BASE_IMAGE as deployment

# Install Node.js and npm for development
RUN apk add --no-cache nodejs npm

# Fix Trivy Warnings
RUN apk --no-cache add "busybox-binsh>=1.36.1-r16" "libcrypto3>=3.1.5-r0" "libcurl>=8.7.1-r0" "libexpat>=2.6.3-r0" "libssl3>=3.1.5-r0" "libx11>=1.8.7-r0" "libxml2>=2.11.8-r0" "ssl_client>=1.36.1-r17"

# Copy the built files from the build stage
COPY --from=build /app/dist/ /usr/share/nginx/html/

# Remove the default NGINX configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy the custom NGINX configuration
COPY nginx-vue.conf /etc/nginx/conf.d/

# Set permissions for NGINX
RUN chown -R nginx:nginx /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chmod -R 644 /etc/nginx/conf.d/*

# Create and set permissions for the NGINX PID file
RUN touch /run/nginx.pid \
    && chown -R nginx:nginx /run/nginx.pid /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html

# Switch to the nginx user
USER nginx

# Expose the NGINX port
EXPOSE 8080

# Conditional command for development or production
CMD if [ "$NODE_ENV" = "dev" ]; then \
      npm install && vite; \
    else \
      nginx -g "daemon off;"; \
    fi