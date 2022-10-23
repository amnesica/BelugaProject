FROM node:16-alpine AS builder
WORKDIR Webapp
COPY . .
RUN cd Webapp && npm install && npm run build -- --configuration production

FROM nginx:alpine
COPY --from=builder /Webapp/Webapp/dist/Webapp/ /usr/share/nginx/html/
COPY /Webapp/nginx-default.conf /etc/nginx/conf.d/default.conf
# When the container starts, replace the env.js with values from environment variables
CMD ["/bin/sh", "-c", "envsubst < /usr/share/nginx/html/assets/env.template.js > /usr/share/nginx/html/assets/env.js && exec nginx -g 'daemon off;'"]
