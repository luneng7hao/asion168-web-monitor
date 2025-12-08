<template>
  <div class="about">
    <div class="card">
      <h2>📖 关于页面</h2>
      <p>这是关于页面，用于测试路由变化监控。</p>
      <p>当你访问这个页面时，监控 SDK 会自动记录路由变化。</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'About'
};
</script>

<style scoped>
.about {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.card h2 {
  margin-bottom: 20px;
  color: #333;
}

.card p {
  margin-bottom: 15px;
  color: #666;
  line-height: 1.6;
}
</style>

