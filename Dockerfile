
ARG BASE_IMAGE_BUILDER=node:21.6.0-alpine3.19
ARG BASE_IMAGE=nginx:1.25-alpine

# Build Stage
FROM $BASE_IMAGE_BUILDER as build


# OpenJDK 17,is a specific requirement for running the OpenAPI code generator(SPSH-242-generate-api-client-in-ci)
# Avoiding apk update  in Build Stage:
#RUN apk update \
# && apk add openjdk17-jre
#To maintain stability, we install OpenJDK without running apk update. This limits the changes in Docker image to just adding OpenJDK, rather than potentially updating all packages.
#Pin the OpenJDK 17 JRE version to the latest deployed version
#https://pkgs.alpinelinux.org/package/edge/community/x86_64/openjdk17-jre-headless

RUN apk add openjdk17-jre=17.0.10_p7-r0

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