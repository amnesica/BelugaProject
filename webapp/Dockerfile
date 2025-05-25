FROM node:22-alpine AS builder
WORKDIR webapp
COPY . .
RUN cd webapp && npm install
RUN cd webapp && npm install -g npm@10.8.2 
RUN cd webapp && node --max_old_space_size=2500 ./node_modules/@angular/cli/bin/ng build --configuration production

FROM nginx:alpine
COPY --from=builder /webapp/webapp/dist/webapp/ /usr/share/nginx/html/
COPY /webapp/nginx-default.conf /etc/nginx/conf.d/default.conf
# When the container starts, replace the env.js with values from environment variables
CMD ["/bin/sh", "-c", "envsubst < /usr/share/nginx/html/assets/env.template.js > /usr/share/nginx/html/assets/env.js && exec nginx -g 'daemon off;'"]
