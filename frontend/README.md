# 前端监控系统管理端

基于 Vue 3 + TypeScript + Vite 的前端监控系统管理端，提供数据可视化和监控管理功能。

## 📋 目录

- [技术栈](#技术栈)
- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [开发指南](#开发指南)
- [构建部署](#构建部署)

## 🛠️ 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 下一代前端构建工具
- **Element Plus** - Vue 3 UI 组件库
- **ECharts** - 数据可视化图表库
- **Vue Router** - 官方路由管理器
- **Pinia** - Vue 状态管理（如需要）

## ✨ 功能特性

### 1. 数据概览 (Dashboard)

- 📊 实时核心指标展示
  - 今日错误数
  - 今日 PV/UV
  - 接口成功率
  - 平均响应时间
- 📈 趋势图表
  - 错误趋势（7天/30天）
  - 性能趋势
  - 用户行为趋势
  - 接口监控趋势
- 🔄 自动刷新（每30秒）

### 2. 错误监控

- 📋 错误列表查看
  - 错误类型筛选
  - 时间范围筛选
  - 搜索功能
- 🔍 错误详情
  - 错误堆栈信息
  - 用户信息
  - 发生次数统计
  - 影响用户数
- 📊 错误统计
  - 错误类型分布
  - 错误趋势分析
  - Top 10 错误排行

### 3. 性能监控

- ⚡ 性能指标展示
  - 页面加载时间
  - Web Vitals (FCP, LCP, FID, CLS)
  - DNS 解析时间
  - TCP 连接时间
- 📈 性能趋势分析
- 📋 性能数据列表

### 4. 用户行为

- 👥 用户统计
  - PV/UV 统计
  - 访问趋势图
  - 热门页面排行
- 🎯 行为事件
  - 点击事件
  - 路由变化
  - 自定义事件

### 5. 接口监控

- 🔌 接口统计
  - 请求总数
  - 成功率
  - 平均响应时间
- 📊 接口分析
  - 热门接口排行
  - 错误接口详情
  - 响应时间分布

### 6. 日志查询

- 🔍 全文搜索
  - 关键词搜索
  - 时间范围筛选
  - 日志类型筛选
- 📋 日志详情查看

## 🚀 快速开始

### 前置要求

- Node.js >= 16.0.0
- npm 或 yarn

### 安装依赖

```bash
cd frontend
npm install
```

### 配置 API 地址

修改 `src/api/index.ts`：

```typescript
const API_BASE_URL = 'http://localhost:3000/api'  // 后端 API 地址
```

### 开发模式

```bash
npm run dev
```

前端管理端将在 `http://localhost:5173` 启动。

### 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录。

### 预览生产构建

```bash
npm run preview
```

## 📁 项目结构

```
frontend/
├── src/
│   ├── api/              # API 接口
│   │   └── index.ts      # API 封装
│   ├── views/            # 页面组件
│   │   ├── Dashboard.vue # 数据概览
│   │   ├── Errors.vue    # 错误监控
│   │   ├── Performance.vue # 性能监控
│   │   ├── Behavior.vue  # 用户行为
│   │   ├── Api.vue       # 接口监控
│   │   └── Logs.vue     # 日志查询
│   ├── router/           # 路由配置
│   │   └── index.ts
│   ├── stores/           # 状态管理（如需要）
│   ├── App.vue           # 根组件
│   └── main.ts           # 入口文件
├── index.html            # HTML 模板
├── vite.config.ts        # Vite 配置
├── tsconfig.json         # TypeScript 配置
└── package.json
```

## 🔧 开发指南

### 添加新页面

1. 在 `src/views/` 创建新组件
2. 在 `src/router/index.ts` 添加路由：

```typescript
{
  path: '/new-page',
  name: 'NewPage',
  component: () => import('../views/NewPage.vue')
}
```

### 添加新的 API 接口

在 `src/api/index.ts` 中添加：

```typescript
export const newApi = {
  getData: (params: any) => {
    return request.get('/new-api', { params })
  },
  postData: (data: any) => {
    return request.post('/new-api', data)
  }
}
```

### 使用 ECharts

```vue
<template>
  <div ref="chartRef" style="width: 100%; height: 400px;"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'

const chartRef = ref<HTMLDivElement>()

onMounted(() => {
  const chart = echarts.init(chartRef.value!)
  chart.setOption({
    // ECharts 配置
  })
})
</script>
```

## 🎨 UI 组件

项目使用 Element Plus，常用组件：

```vue
<template>
  <!-- 表格 -->
  <el-table :data="tableData">
    <el-table-column prop="name" label="名称" />
  </el-table>
  
  <!-- 日期选择器 -->
  <el-date-picker
    v-model="dateRange"
    type="daterange"
    range-separator="至"
    start-placeholder="开始日期"
    end-placeholder="结束日期"
  />
  
  <!-- 分页 -->
  <el-pagination
    v-model:current-page="currentPage"
    :page-size="pageSize"
    :total="total"
    layout="total, sizes, prev, pager, next, jumper"
  />
</template>
```

## 📊 数据可视化

### 折线图示例

```typescript
const lineChartOption = {
  title: { text: '错误趋势' },
  xAxis: {
    type: 'category',
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  yAxis: { type: 'value' },
  series: [{
    data: [120, 200, 150, 80, 70, 110, 130],
    type: 'line'
  }]
}
```

### 饼图示例

```typescript
const pieChartOption = {
  series: [{
    type: 'pie',
    data: [
      { value: 1048, name: 'JavaScript 错误' },
      { value: 735, name: '资源加载错误' },
      { value: 580, name: 'Promise 错误' }
    ]
  }]
}
```

## 🔐 环境配置

### 开发环境

创建 `.env.development`：

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### 生产环境

创建 `.env.production`：

```env
VITE_API_BASE_URL=https://api.your-domain.com/api
```

在代码中使用：

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
```

## 🚢 构建部署

### 构建

```bash
npm run build
```

### 部署到 Nginx

1. 将 `dist/` 目录内容复制到 Nginx 静态文件目录
2. 配置 Nginx：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 部署到 Docker

创建 `Dockerfile`：

```dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🐛 问题排查

### 页面空白

1. 检查浏览器控制台是否有错误
2. 检查 API 地址配置是否正确
3. 检查后端服务是否正常运行

### 图表不显示

1. 检查数据格式是否正确
2. 检查 ECharts 是否正确初始化
3. 检查容器元素是否有宽高

### 路由跳转失败

1. 检查路由配置是否正确
2. 检查 Nginx 配置（生产环境）

## 📚 相关文档

- [项目主文档](../README.md)
- [后端文档 - MidwayJS](../backend-midway/README.md)
- [后端文档 - Spring Boot](../backend-springboot/README.md)
- [SDK 文档](../sdk/README.md)

## 📄 许可证

MIT

## 🔗 相关链接

- [项目主页](https://gitee.com/luneng17hao/asion168-web-monitor)
- [问题反馈](https://gitee.com/luneng17hao/asion168-web-monitor/issues)
- [贡献指南](../CONTRIBUTING.md)

