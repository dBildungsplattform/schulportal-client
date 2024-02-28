
ARG BASE_IMAGE_BUILDER=node:21.6-alpine3.19
ARG BASE_IMAGE=nginx:1.25-alpine

# Build Stage
FROM $BASE_IMAGE_BUILDER as build

RUN apk add openjdk17-jre=17.0.10_p7-r0

WORKDIR /app
COPY tsconfig*.json ./
COPY package*.json ./
COPY vite*.ts ./
COPY index.html ./
COPY openapitools.json ./
COPY env*.ts ./
COPY src/ src/
COPY public/ public/

RUN npm ci
RUN npx openapi-generator-cli generate --generator-key bff --openapi-normalizer REFACTOR_ALLOF_WITH_PROPERTIES_ONLY=true
RUN npm run build

# Deployment Stage
FROM $BASE_IMAGE as deployment
RUN apk add libexpat=2.6.0-r0  \
    && rm -rf /var/cache/apk/*

COPY --from=build /app/dist/ /usr/share/nginx/html/
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx-vue.conf /etc/nginx/conf.d/