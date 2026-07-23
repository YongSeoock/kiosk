FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY kiosk-Back/demo/pom.xml pom.xml
COPY kiosk-Back/demo/src src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/demo-0.0.1-SNAPSHOT.jar app.jar
CMD ["sh", "-c", "java -jar app.jar --server.port=${PORT:-8080}"]
