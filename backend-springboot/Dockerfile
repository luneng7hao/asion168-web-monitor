# 多阶段构建
# 阶段1: 构建应用
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# 阶段2: 运行应用
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# 暴露端口
EXPOSE 3001

# 启动应用
ENTRYPOINT ["java", "-jar", "app.jar"]

