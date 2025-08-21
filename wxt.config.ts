import AutoImport from 'unplugin-auto-import/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'wxt';
// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-vue', '@wxt-dev/unocss'],
  manifest: {
    permissions: [
      'storage',
      'commands',
      'contextMenus',
      'tabs',
      'scripting',
    ],
    commands: {
      'open-search': {
        suggested_key: {
          default: 'Ctrl+Shift+Space',
          mac: 'Command+Shift+Space',
        },
        description: 'Open Search Bar',
      },
    },
    host_permissions: [
      '*://*/*',
    ],
  },
  vite: () => ({
    plugins: [
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ],
  }),
});
