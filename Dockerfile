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
COPY env*.ts ./
COPY src/ src/
COPY public/ public/

RUN npm install
RUN npm run build

# Deployment Stage
FROM $BASE_IMAGE as deployment


#fix erreur:
#ERROR: failed to solve: process "/bin/sh -c apk add libexpat=2.6.0-r0  
#&& rm -rf /var/cache/apk/*" did not complete successfully: exit code: 4
#Error: buildx failed with: ERROR: failed to solve: process 
#"/bin/sh -c apk add libexpat=2.6.0-r0      && rm -rf /var/cache/apk/*"
#did not complete successfully: exit code: 4

RUN apk update && \
    apk add libexpat && \
    rm -rf /var/cache/apk/*


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