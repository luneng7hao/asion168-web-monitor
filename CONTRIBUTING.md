# 贡献指南

感谢您对 Asion168 Web Monitor 项目的关注！我们欢迎所有形式的贡献。

## 如何贡献

### 报告问题

如果您发现了 Bug 或有功能建议，请在 [Gitee Issues](https://gitee.com/luneng17hao/asion168-web-monitor/issues) 中提交。

提交 Issue 时，请包含：
- 清晰的问题描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息（Node.js 版本、操作系统等）
- 相关截图或日志

### 提交代码

1. **Fork 项目**
   ```bash
   # 在 GitHub 上 Fork 项目
   ```

2. **克隆 Fork 的仓库**
   ```bash
   git clone https://gitee.com/your-username/asion168-web-monitor.git
   cd asion168-web-monitor
   ```

3. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

4. **进行开发**
   - 编写代码
   - 添加必要的测试
   - 更新相关文档

5. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   提交信息格式：
   - `feat:` 新功能
   - `fix:` Bug 修复
   - `docs:` 文档更新
   - `style:` 代码格式调整（不影响功能）
   - `refactor:` 代码重构
   - `test:` 测试相关
   - `chore:` 构建过程或辅助工具的变动

6. **推送到远程仓库**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **创建 Pull Request**
   - 在 Gitee 上创建 Pull Request
   - 填写清晰的 PR 描述
   - 关联相关的 Issue（如果有）

## 代码规范

### TypeScript/JavaScript

- 使用 TypeScript 编写代码
- 遵循 ESLint 规则
- 使用 2 空格缩进
- 使用单引号
- 添加必要的类型注解
- 函数和类需要添加 JSDoc 注释

### Java

- 遵循 Google Java Style Guide
- 使用 4 空格缩进
- 类和方法需要添加 JavaDoc 注释

### 提交信息

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

示例：
```
feat(sdk): add error retry mechanism

Add automatic retry for failed error reports with exponential backoff.
This improves reliability in unstable network conditions.

Closes #123
```

## 开发环境设置

### 后端开发（MidwayJS）

```bash
cd backend-midway
npm install
npm run dev
```

### 后端开发（Spring Boot）

```bash
cd backend-springboot
mvn clean install
mvn spring-boot:run
```

### 前端开发

```bash
cd frontend
npm install
npm run dev
```

### SDK 开发

```bash
cd sdk
npm install
npm run build
npm run test
```

## 测试

在提交 PR 之前，请确保：

- [ ] 代码通过所有测试
- [ ] 新增功能包含测试用例
- [ ] 代码通过 ESLint/TSLint 检查
- [ ] 更新了相关文档

## 文档

- 代码注释：使用 JSDoc/JavaDoc 格式
- README：更新相关的 README 文件
- API 文档：更新 API 接口文档（如果有）

## 行为准则

- 尊重所有贡献者
- 接受建设性的批评
- 专注于对项目最有利的事情
- 对其他社区成员表示同理心

## 问题？

如果您在贡献过程中遇到任何问题，请：

1. 查看 [Issues](https://gitee.com/luneng17hao/asion168-web-monitor/issues)
2. 在 [Pull Requests](https://gitee.com/luneng17hao/asion168-web-monitor/pulls) 中提问
3. 联系项目维护者

感谢您的贡献！🎉

