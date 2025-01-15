import { createApp } from 'vue';
import './style.css';
import '../global/styles/theme.css';
import App from './App.vue';
import 'uno.css';
import i18n from '../global/locale';

const app = createApp(App);
app.use(i18n);
app.mount('#app');
