import { createApp } from 'vue';
import App from './contents/App.vue';
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'uno.css'

export default defineContentScript({
  matches: ['*://*/*'],
  main() {
    console.log('Hello content.');
    const root = document.createElement('div');
    root.id = 'json-search-container';
    document.body.appendChild(root);
    const app = createApp(App);
    app.use(ElementPlus);
    app.mount(root);
  },
});
