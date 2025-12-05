<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-content">
        <div class="logo-section">
          <div class="logo-icon-wrapper">
            <div class="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
          <div class="logo-content">
            <div class="logo-main">
              <span class="logo-text">Asion</span>
              <span class="logo-number">168</span>
            </div>
            <div class="logo-subtitle">前端监控系统</div>
          </div>
        </div>
        <div class="header-right">
          <div class="project-info">
            <span class="project-label">项目编号：</span>
            <span class="project-id">001</span>
          </div>
          <el-button 
            type="danger" 
            size="small" 
            @click="handleClearData"
            style="margin-left: 16px"
          >
            清除所有数据
          </el-button>
        </div>
      </div>
    </el-header>
    <el-container>
      <el-aside width="200px" class="app-aside">
        <el-menu
          :default-active="activeMenu"
          router
          class="sidebar-menu"
        >
          <el-menu-item index="/dashboard">
            <el-icon><DataBoard /></el-icon>
            <span>数据概览</span>
          </el-menu-item>
          <el-menu-item index="/errors">
            <el-icon><Warning /></el-icon>
            <span>错误监控</span>
          </el-menu-item>
          <el-menu-item index="/performance">
            <el-icon><Timer /></el-icon>
            <span>性能监控</span>
          </el-menu-item>
          <el-menu-item index="/behavior">
            <el-icon><User /></el-icon>
            <span>用户行为</span>
          </el-menu-item>
          <el-menu-item index="/api-monitor">
            <el-icon><Connection /></el-icon>
            <span>接口监控</span>
          </el-menu-item>
          <el-menu-item index="/logs">
            <el-icon><Document /></el-icon>
            <span>监控日志</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { DataBoard, Warning, Timer, User, Connection, Document } from '@element-plus/icons-vue'
import { dataCleanupApi } from './api'
import { useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activeMenu = computed(() => route.path)

const handleClearData = async () => {
  try {
    await ElMessageBox.confirm(
      '此操作将清除所有监控数据（包括错误、性能、行为、接口监控、监控日志等），且无法恢复。确定要继续吗？',
      '警告',
      {
        confirmButtonText: '确定清除',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: false
      }
    )
    
    const res = await dataCleanupApi.clearAll()
    if (res.data.success) {
      ElMessage.success('所有监控数据已清除')
      // 刷新当前页面
      setTimeout(() => {
        router.go(0)
      }, 1000)
    } else {
      ElMessage.error(res.data.message || '清除数据失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('清除数据失败: ' + (error.message || '未知错误'))
    }
  }
}
</script>

<style scoped>
.app-container {
  height: calc(100vh - 16px);
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 60px !important;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}

.logo-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.logo-icon-wrapper:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.logo-icon {
  width: 28px;
  height: 28px;
  color: #ffd700;
  filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
}

.logo-icon svg {
  width: 100%;
  height: 100%;
}

.logo-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.logo-main {
  display: flex;
  align-items: baseline;
  line-height: 1;
  gap: 4px;
}

.logo-text {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-family: 'Arial', 'Helvetica', sans-serif;
  position: relative;
}

.logo-number {
  font-size: 32px;
  font-weight: 800;
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3);
  font-family: 'Arial', 'Helvetica', sans-serif;
  position: relative;
}

.logo-subtitle {
  font-size: 13px;
  opacity: 0.9;
  font-weight: 400;
  letter-spacing: 17px;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.app-aside {
  background-color: #fff;
  border-right: 1px solid #e4e7ed;
}

.sidebar-menu {
  border-right: none;
  height: 100%;
}

.app-main {
  background-color: #f5f7fa;
  padding: 16px;
}

.header-actions {
  display: flex;
  align-items: center;
}

.project-info {
  display: flex;
  align-items: center;
  font-size: 14px;
  opacity: 0.9;
}

.project-label {
  margin-right: 8px;
  opacity: 0.8;
}

.project-id {
  font-family: monospace;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
}
</style>

