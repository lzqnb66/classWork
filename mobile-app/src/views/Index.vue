<template>
  <div>
    <van-nav-bar title="健康数据记录">
    </van-nav-bar>
    <router-view />

    <!-- 底部导航菜单 -->
    <van-tabbar fixed route>
      <van-tabbar-item name="home" icon="home-o" to="/home">记录</van-tabbar-item>
      <van-tabbar-item name="my" icon="user-o" to="/my">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
// 使用 Vant Tabbar 的 route 模式自动与路由同步，无需手动管理 active 状态
</script>

<style scoped>

</style>