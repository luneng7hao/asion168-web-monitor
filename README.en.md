# Asion168 Web Monitor

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![Java Version](https://img.shields.io/badge/java-%3E%3D17-orange.svg)

A complete frontend monitoring solution with error tracking, performance analysis, user behavior tracking, and API monitoring.

[English](./README.en.md) | [中文](./README.md)

</div>

## ✨ Features

- 🐛 **Error Monitoring** - Automatically captures JavaScript errors, resource loading errors, and Promise errors
- ⚡ **Performance Monitoring** - Page load time, Web Vitals (FCP, LCP, FID, CLS), resource loading analysis
- 👤 **User Behavior** - PV/UV statistics, click tracking, route change monitoring
- 🔌 **API Monitoring** - API request success rate, response time, error statistics
- 📊 **Data Visualization** - Real-time Dashboard, trend charts, detailed analysis reports
- 🔍 **Log Query** - Elasticsearch-based log search and analysis
- 📱 **Multi-platform Support** - Web, WeChat Mini Program, React, Vue2/3, Svelte
- 🚀 **Out of the Box** - Docker one-click deployment, supports local development and production environments

## 🏗️ Technical Architecture

### Backend Tech Stack

- **MidwayJS** (Node.js) - Recommended, feature-complete
- **Spring Boot** (Java) - Enterprise-grade backend implementation
- **MongoDB** - Stores error details and project information
- **InfluxDB** - Time-series data storage (performance, behavior, API monitoring)
- **Redis** - Caching and real-time counting
- **Elasticsearch** - Log query and analysis

### Frontend Tech Stack

- **Vue 3** + **TypeScript** + **Vite**
- **Element Plus** - UI component library
- **ECharts** - Data visualization

### SDK Support

- ✅ Web (Native JavaScript, suitable for HTML, JSP, PHP and other traditional web applications)
- ✅ WeChat Mini Program
- ✅ React
- ✅ Vue 2/3
- ✅ Svelte

## 📦 Project Structure

```
Asion168-web-monitor/
├── backend-midway/      # MidwayJS Backend (Recommended)
│   ├── src/
│   │   ├── controller/  # API Controllers
│   │   ├── service/     # Business Services
│   │   ├── entity/      # MongoDB Entities
│   │   └── config/      # Configuration Files
│   ├── docker-compose.yml
│   └── package.json
├── backend-springboot/  # Spring Boot Backend
│   ├── src/
│   │   └── main/java/com/monitor/
│   ├── docker-compose.yml
│   └── pom.xml
├── frontend/            # Vue3 Admin Panel
│   ├── src/
│   │   ├── views/       # Page Components
│   │   ├── api/         # API Interfaces
│   │   └── router/      # Route Configuration
│   └── package.json
├── sdk/                 # Monitoring SDK
│   ├── src/
│   │   ├── index.ts     # Web SDK
│   │   ├── miniprogram.ts # Mini Program SDK
│   │   ├── vue.ts       # Vue Plugin
│   │   ├── react.ts     # React Plugin
│   │   └── svelte.ts    # Svelte Plugin
│   ├── examples/        # Usage Examples (includes test projects for Web, JSP, PHP, Vue, React, Svelte, Mini Program, etc.)
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- Java >= 17 (if using Spring Boot backend)
- Docker & Docker Compose (Recommended)
- MongoDB >= 6.0
- InfluxDB >= 2.0
- Redis >= 6.0
- Elasticsearch >= 8.0 (Optional)

### Method 1: Using Docker (Recommended)

#### 1. Start MidwayJS Backend

```bash
# Clone the project
git clone https://gitee.com/luneng17hao/asion168-web-monitor.git
# or git clone https://github.com/luneng7hao/asion168-web-monitor.git
cd asion168-web-monitor

# Start backend services (including databases)
cd backend-midway
docker-compose up -d

# Install dependencies and start the application
npm install
npm run dev
```

The backend service will start at `http://localhost:3000`

#### 2. Start Spring Boot Backend (Optional)

```bash
cd backend-springboot
docker-compose up -d
```

The backend service will start at `http://localhost:3001`

#### 3. Start Frontend Admin Panel

```bash
cd frontend
npm install
npm run dev
```

The frontend admin panel will start at `http://localhost:5173`

### Method 2: Local Development

#### 1. Start Database Services

Start databases using Docker Compose:

```bash
cd backend-midway
docker-compose up -d mongodb influxdb redis elasticsearch
```

Or install and start manually:
- MongoDB: Port 27017
- InfluxDB: Port 8086
- Redis: Port 6379
- Elasticsearch: Port 9200

#### 2. Configure Backend

Modify `backend-midway/src/config/config.default.ts`:

```typescript
export default {
  // MongoDB Configuration
  typegoose: {
    dataSource: {
      default: {
        uri: 'mongodb://localhost:27017/monitor',
      },
    },
  },
  // InfluxDB Configuration
  influxdb: {
    host: 'localhost',
    port: 8086,
    database: 'monitor',
  },
  // Redis Configuration
  redis: {
    clients: {
      default: {
        host: 'localhost',
        port: 6379,
      },
    },
  },
}
```

#### 3. Start Services

```bash
# Backend
cd backend-midway
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## 📖 Using the SDK

### Web Project

```bash
cd sdk
npm install
npm run build
```

Import in your project:

```javascript
import Monitor from '@asion168/monitor-sdk'

const monitor = new Monitor({
  apiUrl: 'http://localhost:3000/api',
  projectId: '001',  // Default project ID
  userId: 'user-123' // Optional
})

// Automatically start monitoring
monitor.init()
```

### Vue 3 Project

```javascript
import { createApp } from 'vue'
import App from './App.vue'
import { VueMonitor } from '@asion168/monitor-sdk/vue'

const app = createApp(App)

app.use(VueMonitor, {
  apiUrl: 'http://localhost:3000/api',
  projectId: '001'
})

app.mount('#app')
```

### React Project

```javascript
import React from 'react'
import { ReactMonitor } from '@asion168/monitor-sdk/react'

function App() {
  ReactMonitor.init({
    apiUrl: 'http://localhost:3000/api',
    projectId: '001'
  })
  
  return <div>Your App</div>
}
```

### WeChat Mini Program

```javascript
import MiniProgramMonitor from '@asion168/monitor-sdk/miniprogram'

MiniProgramMonitor.init({
  apiUrl: 'http://localhost:3000/api',
  projectId: '001'
})
```

## 📚 Test Project Examples

The project provides multiple test projects for quick start and testing:

### Web Test Projects

- **`examples/web/`** - Native JavaScript test project (for HTML, JSP, PHP and other traditional web applications)
- **`examples/jsp/`** - JSP test project demonstrating how to integrate the monitoring SDK in JSP projects
- **`examples/php/`** - PHP test project demonstrating how to integrate the monitoring SDK in PHP projects

### Framework Test Projects

- **`examples/vue3/`** - Vue 3 test project
- **`examples/vue2/`** - Vue 2 test project
- **`examples/react/`** - React test project
- **`examples/svelte/`** - Svelte test project

### Mini Program Test Project

- **`examples/miniprogram/`** - WeChat Mini Program test project demonstrating the usage of the Mini Program monitoring SDK

Each test project includes:
- Complete integration examples
- Error test pages
- Performance test pages
- Behavior tracking examples
- Detailed README documentation

For more examples, please check the [sdk/examples](./sdk/examples/) directory.

## 📊 Data Storage Architecture

| Data Type | Storage | Description |
|-----------|---------|-------------|
| Error Details | MongoDB | Error stack, context, aggregation information |
| Performance Data | InfluxDB | Time-series data for trend analysis |
| User Behavior | InfluxDB | PV/UV, clicks, and other time-series statistics |
| API Monitoring | InfluxDB | Response time, success rate time-series data |
| Statistics Cache | Redis | Dashboard and statistics data cache |
| Real-time Count | Redis | Today's error count, PV/UV real-time counting |
| Monitoring Logs | Elasticsearch | Log query and analysis |

## 🔧 Configuration

### Single Project Mode

The system uses single project mode by default, with all data using project ID `001`. For multi-project support, you can modify the backend code.

### Environment Variables

Backend environment variable configuration:

```bash
# MongoDB
MONGO_URI=mongodb://localhost:27017/monitor

# InfluxDB
INFLUXDB_HOST=localhost
INFLUXDB_PORT=8086
INFLUXDB_DATABASE=monitor

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200
```

## 📚 Documentation

- [Backend Documentation - MidwayJS](./backend-midway/README.md)
- [Backend Documentation - Spring Boot](./backend-springboot/README.md)
- [SDK Documentation](./sdk/README.md)
- [Mini Program Usage Guide](./sdk/miniprogram-usage.md)

## 🤝 Contributing

We welcome all forms of contributions!

### How to Contribute

1. **Report Issues** - Report bugs or suggest features in [Issues](https://gitee.com/luneng17hao/asion168-web-monitor/issues)
2. **Submit Code** - Fork the project, create a feature branch, submit a Pull Request
3. **Improve Documentation** - Help improve documentation and example code
4. **Share Experience** - Share usage experience in Discussions

### Development Process

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Standards

- Write code using TypeScript
- Follow ESLint rules
- Add necessary comments and documentation
- Write unit tests (if possible)

## 📝 Changelog

Check [CHANGELOG.md](./CHANGELOG.md) for version update history.

## 🗺️ Roadmap

- [ ] Support multi-project mode
- [ ] Add alerting functionality
- [ ] Support data export
- [ ] Performance optimization and cache strategy improvements
- [ ] Add more chart types
- [ ] Support custom Dashboard
- [ ] Add user permission management

## ❓ FAQ

### Q: How to switch to multi-project mode?

A: The current version uses single project mode, with all data using project ID `001`. For multi-project support, you need to modify the backend code to add project management and data isolation logic.

### Q: Where is the data stored?

A: Error details are stored in MongoDB, performance and behavior data are stored in InfluxDB, cache data is stored in Redis, and log data is stored in Elasticsearch.

### Q: How to clean historical data?

A: You can use the data cleanup API or directly operate the database. The MidwayJS backend provides the `/api/data-cleanup/clear-all` endpoint.

### Q: Which browsers are supported?

A: The SDK supports all modern browsers (Chrome, Firefox, Safari, Edge, etc.), requiring ES6+ and Promise support.

## 📄 License

This project is licensed under the [MIT](./LICENSE) License.

## 🙏 Acknowledgments

Thanks to all developers who have contributed to this project!

## 📮 Contact

- Project Repository: [Gitee](https://gitee.com/luneng17hao/asion168-web-monitor)
- Issue Reports: [Issues](https://gitee.com/luneng17hao/asion168-web-monitor/issues)
- Discussions: [Pull Requests](https://gitee.com/luneng17hao/asion168-web-monitor/pulls)

---

<div align="center">

If this project helps you, please give it a ⭐ Star

Made with ❤️ by Asion168

</div>

