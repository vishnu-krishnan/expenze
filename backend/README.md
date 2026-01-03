# Expenze Backend (Spring Boot)

This is the migrated Spring Boot backend for Expenze.

## Prerequisites
- Java 21
- Maven
- PostgreSQL

## Configuration
The application uses the following environment variables (compatible with the previous Node.js setup):
- `PGHOST`
- `PGPORT`
- `PGDATABASE`
- `PGUSER`
- `PGPASSWORD`
- `JWT_SECRET`
- `PORT` (Default: 8080)

## Running the Application
```bash
mvn spring-boot:run
```

## Build
```bash
mvn clean install
java -jar target/expenze-backend-0.0.1-SNAPSHOT.jar
```

## Structure
- `src/main/java/com/expenze/entity`: CPA Entities
- `src/main/java/com/expenze/repository`: Data Access Layer
- `src/main/java/com/expenze/service`: Business Logic
- `src/main/java/com/expenze/controller`: REST API Endpoints
- `src/main/java/com/expenze/security`: JWT Authentication config
