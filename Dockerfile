# Build Stage
FROM maven:3.8.7-eclipse-temurin-17 AS build
WORKDIR /app
COPY springapp/pom.xml .
COPY springapp/src ./src
RUN mvn clean package -DskipTests

# Run Stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/SpringBootEmp-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENV PORT=8080
ENTRYPOINT ["java", "-jar", "app.jar"]
