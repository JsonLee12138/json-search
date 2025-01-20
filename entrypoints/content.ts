import { createApp } from 'vue';
import App from './contents/App.vue';
import './global/styles/theme.css';
import 'uno.css';
import type { PerBrowserOption } from 'wxt';
import packageJson from '../package.json';
import i18n from './global/locale';
import { vClickOutside } from './global/directive/clickOutside';

const devMatches: PerBrowserOption<string[]> = ['http://localhost/*', 'https://www.baidu.com/*', 'http://www.google.com/*'] as const;
const prodMatches: PerBrowserOption<string[]> = ['*://*/*'] as const;
const __DEV__ = import.meta.env.MODE === 'development' as const;
const matches = __DEV__ ? devMatches : prodMatches;

export default defineContentScript({
  matches,
  main() {
    // 欢迎词
    console.log(`Welcome to Json Search, current env mode is ${import.meta.env.MODE}, current version is ${packageJson.version}`);

    const root = document.createElement('div');
    root.className = 'json-search-root';
    document.body.appendChild(root);
    const app = createApp(App);
    app.use(i18n);
    app.directive('click-outside', vClickOutside)
    app.mount(root);
  },
});
