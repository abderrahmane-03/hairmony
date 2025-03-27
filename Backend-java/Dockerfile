# Build stage
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
ARG MAVEN_ARGS
WORKDIR /Backend-java
COPY pom.xml .
RUN mvn dependency:go-offline -B $MAVEN_ARGS
COPY src ./src
RUN mvn clean package -DskipTests $MAVEN_ARGS

# Runtime stage
FROM openjdk:21-slim
WORKDIR /Backend-java
# Install libraries required by OpenCV (e.g., libgtk-x11-2.0.so.0)
RUN apt-get update && \
    apt-get install -y libgtk2.0-0 libsm6 libxext6 libxrender1 && \
    rm -rf /var/lib/apt/lists/*
COPY --from=builder /Backend-java/target/race-track-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8443
ENTRYPOINT ["java", "-jar", "app.jar"]
