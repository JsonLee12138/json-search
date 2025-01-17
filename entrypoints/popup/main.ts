import { createApp } from 'vue';
import './style.css';
import '../global/styles/theme.css';
import App from './App.vue';
import 'uno.css';
import i18n from '../global/locale';

const app = createApp(App);
const root = document.createElement('div');
root.className = 'json-search-root';
document.body.appendChild(root);
app.use(i18n);
app.mount(root);
