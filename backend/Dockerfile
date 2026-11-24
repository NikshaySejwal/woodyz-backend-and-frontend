# Use an official Maven image to build the application
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN for i in 1 2 3 4 5; do mvn -B clean package -DskipTests && exit 0; echo "retry $i"; sleep 20; done; exit 1

# Use an official OpenJDK image to run the application
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
