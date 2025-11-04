import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router/index.js';

import 'vant/lib/index.css';
import {
  ConfigProvider,
  Field as VanField,
  CellGroup as VanCellGroup,
  Button as VanButton,
  NavBar as VanNavBar,
  Tabs as VanTabs,
  Tab as VanTab,
  List as VanList,
  Cell as VanCell,
  Tabbar as VanTabbar,
  TabbarItem as VanTabbarItem,
  Toast
} from 'vant';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(ConfigProvider);
app.component('van-field', VanField);
app.component('van-cell-group', VanCellGroup);
app.component('van-button', VanButton);
app.component('van-nav-bar', VanNavBar);
app.component('van-tabs', VanTabs);
app.component('van-tab', VanTab);
app.component('van-list', VanList);
app.component('van-cell', VanCell);
app.component('van-tabbar', VanTabbar);
app.component('van-tabbar-item', VanTabbarItem);
app.config.globalProperties.$toast = Toast;
app.mount('#app');
