FROM maven:3.8.6-amazoncorretto-17 AS builder
WORKDIR /server
COPY . /server
RUN cd server && mvn clean install -DskipTests

FROM amazoncorretto:17-alpine
WORKDIR /server
COPY --from=builder /server/server/prod/config /server/prod/config
COPY --from=builder /server/server/prod/BelugaProject-*.jar /server/prod/BelugaProject.jar
CMD java -jar prod/BelugaProject.jar
