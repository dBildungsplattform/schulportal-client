
ARG BASE_IMAGE_BUILDER=node:21.6.0-alpine3.19
ARG BASE_IMAGE=nginx:1.25-alpine

# Build Stage
FROM $BASE_IMAGE_BUILDER as build


WORKDIR /app
COPY tsconfig*.json ./
COPY package*.json ./
COPY vite*.ts ./
COPY index.html ./
COPY env*.ts ./
COPY src/ src/

RUN npm install
RUN npm run build

# Deployment Stage
FROM $BASE_IMAGE as deployment

COPY --from=build /app/dist/ /usr/share/nginx/html/
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx-vue.conf /etc/nginx/conf.d/