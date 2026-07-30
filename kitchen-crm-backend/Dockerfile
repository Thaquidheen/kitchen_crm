# ==========================================
# Stage 1: Build the application
# ==========================================
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

# Copy pom.xml first to leverage Docker cache for dependencies
COPY pom.xml .

# Maven Central resolves to IPv6-first via Cloudflare and the VPS's IPv6 route flaps,
# which has failed builds mid-download. Prefer IPv4 and retry transient transfer errors.
ENV MAVEN_OPTS="-Djava.net.preferIPv4Stack=true"
ENV MAVEN_ARGS="-Dmaven.wagon.http.retryHandler.count=5 -Daether.connector.http.retryHandler.count=5"

# Download dependencies (cached unless pom.xml changes)
RUN mvn dependency:go-offline -B $MAVEN_ARGS

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests -B $MAVEN_ARGS

# ==========================================
# Stage 2: Create the runtime image
# ==========================================
FROM eclipse-temurin:21-jre

WORKDIR /app

# Create a non-root user for security
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app

# Copy the JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Change ownership of the jar
RUN chown appuser:appgroup app.jar

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
