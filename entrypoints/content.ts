import { createApp } from 'vue';
import App from './contents/App.vue';
// import ElementPlus from 'element-plus'
// import 'element-plus/dist/index.css'
import './contents/style.css'
import 'uno.css'

export default defineContentScript({
  matches: ['*://*/*'],
  // matches: ['https://www.baidu.com/*', 'http://localhost:9527/*'],
  main() {
    const root = document.createElement('div');
    root.id = 'json-search-container';
    document.body.appendChild(root);
    const app = createApp(App);
    // app.use(ElementPlus);
    app.mount(root);
  },
});
