FROM maven:3.8.6-amazoncorretto-17 AS builder
WORKDIR /Server
COPY . /Server
RUN cd Server && mvn clean install -DskipTests

FROM amazoncorretto:17-alpine
WORKDIR /Server
COPY --from=builder /Server/Server/prod/config /Server/prod/config
COPY --from=builder /Server/Server/prod/BelugaProject-*.jar /Server/prod/BelugaProject.jar
CMD java -jar prod/BelugaProject.jar
