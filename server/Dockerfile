FROM gradle:8.12.0-jdk17-focal AS builder
WORKDIR /server
COPY . /server
RUN cd server && ./gradlew clean bootJar -x test

FROM eclipse-temurin:17-jre
WORKDIR /server
COPY --from=builder /server/server/prod/config /server/prod/config
COPY --from=builder /server/server/prod/TheBelugaProject*.jar /server/prod/BelugaProject.jar
CMD java -jar prod/BelugaProject.jar
