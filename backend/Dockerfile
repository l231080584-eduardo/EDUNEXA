FROM eclipse-temurin:21-jdk-alpine AS java-build

WORKDIR /workspace
COPY --from=project gradlew settings.gradle build.gradle ./
COPY --from=project gradle ./gradle
COPY --from=project src ./src
COPY src/DatabaseBootstrap.java ./DatabaseBootstrap.java
RUN chmod +x gradlew && ./gradlew --no-daemon clean bootJar

# Build a tiny SQL bootstrap utility against the JDBC driver already included
# in the Spring Boot artifact. This keeps the runtime self-contained.
RUN apk add --no-cache unzip \
    && mkdir -p /workspace/jdbc /workspace/bootstrap \
    && unzip -j build/libs/edunexa.jar 'BOOT-INF/lib/mssql-jdbc-*.jar' -d /workspace/jdbc \
    && JDBC_JAR="$(find /workspace/jdbc -name 'mssql-jdbc-*.jar' -print -quit)" \
    && javac -cp "$JDBC_JAR" -d /workspace/bootstrap DatabaseBootstrap.java

FROM node:22-alpine AS node-build
WORKDIR /gateway
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY src ./src

FROM eclipse-temurin:21-jre-alpine
RUN apk add --no-cache nodejs npm curl tini \
    && addgroup -S edunexa \
    && adduser -S edunexa -G edunexa \
    && mkdir -p /app/bootstrap /app/jdbc /app/gateway
WORKDIR /app
COPY --from=java-build /workspace/build/libs/edunexa.jar /app/app.jar
COPY --from=java-build /workspace/bootstrap/ /app/bootstrap/
COPY --from=java-build /workspace/jdbc/ /app/jdbc/
COPY init.sql /app/init.sql
COPY --from=node-build /gateway/node_modules /app/gateway/node_modules
COPY --from=node-build /gateway/src /app/gateway/src
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh && chown -R edunexa:edunexa /app
ENV NODE_ENV=production PORT=3000 SPRING_API_URL=http://127.0.0.1:8080
USER edunexa
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=90s --retries=5 \
  CMD node -e "Promise.all(['http://127.0.0.1:3000/health','http://127.0.0.1:8080/api/v1/health'].map(u=>fetch(u).then(r=>{if(!r.ok)process.exitCode=1}))).catch(()=>process.exit(1))"
ENTRYPOINT ["/sbin/tini", "-g", "--", "/app/entrypoint.sh"]
