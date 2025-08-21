import type { PerBrowserOption } from 'wxt';
import { createApp } from 'vue';
import packageJson from '../package.json';
import App from './contents/App.vue';
import { vClickOutside } from './global/directive/clickOutside';
import i18n from './global/locale';
import './global/styles/theme.css';
import 'uno.css';

const devMatches: PerBrowserOption<string[]> = [
  // 'http://localhost/*',
  'https://www.baidu.com/*',
  // 'http://www.google.com/*',
  'https://developers.weixin.qq.com/*',
] as const;
const prodMatches: PerBrowserOption<string[]> = ['*://*/*'] as const;
const __DEV__ = import.meta.env.MODE === 'development' as const;
const matches = __DEV__ ? devMatches : prodMatches;

// const excludeMatches: PerBrowserOption<string[]> = ['https://developers.weixin.qq.com/*'] as const;

export default defineContentScript({
  matches,
  // excludeMatches,
  cssInjectionMode: 'ui',
  async main(ctx) {
    // 欢迎词
    // eslint-disable-next-line no-console
    console.log(`Welcome to Json Search, current env mode is ${import.meta.env.MODE}, current version is ${packageJson.version}`);

    const ui = await createShadowRootUi(ctx, {
      name: 'json-search-ui',
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        // Define how your UI will be mounted inside the container
        const app = createApp(App);
        app.use(i18n);
        app.directive('click-outside', vClickOutside);
        container.classList.add('json-search-root');
        app.mount(container);
        return app;
      },
      onRemove: (app) => {
        // Unmount the app when the UI is removed
        app?.unmount();
      },
    });

    ui.mount();
  },
});
