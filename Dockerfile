ARG BASE_IMAGE_BUILDER=node:20.9.0-alpine3.18
ARG BASE_IMAGE=nginx:1.25-alpine
FROM $BASE_IMAGE_BUILDER as scaffold

RUN apk update \
 && apk add openjdk17-jre

WORKDIR /app

COPY tsconfig*.json ./
COPY package*.json ./
COPY vite*.ts ./
COPY index.html ./
COPY openapitools.json ./
COPY env*.ts ./
COPY src/ src/

RUN npm ci
RUN npx openapi-generator-cli generate --generator-key bff --openapi-normalizer REFACTOR_ALLOF_WITH_PROPERTIES_ONLY=true
RUN npm run build

FROM $BASE_IMAGE as deployment

COPY --from=scaffold /app/dist/ /usr/share/nginx/html/
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx-vue.conf /etc/nginx/conf.d/