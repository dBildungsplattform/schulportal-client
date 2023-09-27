ARG BASE_IMAGE_BUILDER=node:20.5.1-alpine3.17
ARG BASE_IMAGE=nginx:1.25-alpine
FROM $BASE_IMAGE_BUILDER as scaffold


WORKDIR /app

COPY tsconfig*.json ./
COPY package*.json ./
COPY vite*.ts ./
COPY index.html ./
COPY env*.ts ./
COPY src/ src/

RUN npm install
RUN npm run build

FROM $BASE_IMAGE as deployment

COPY --from=scaffold /app/dist/ /usr/share/nginx/html/