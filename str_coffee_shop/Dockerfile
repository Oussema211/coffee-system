FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY coffeeshop-backend .
RUN chmod +x mvnw && ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Xmx400m", "-Xss256k", "-XX:+UseSerialGC", "-jar", "app.jar"]
