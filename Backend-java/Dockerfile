FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
ARG MAVEN_ARGS
WORKDIR /Backend-java
COPY pom.xml .
RUN mvn dependency:go-offline -B $MAVEN_ARGS
COPY src ./src
RUN mvn clean package -DskipTests $MAVEN_ARGS

FROM openjdk:21-slim
WORKDIR /Backend-java
COPY --from=builder /Backend-java/target/race-track-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8443
ENTRYPOINT ["java", "-jar", "app.jar"]