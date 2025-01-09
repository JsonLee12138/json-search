import { defineConfig } from 'wxt';
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-vue', '@wxt-dev/unocss'],
  manifest: {
    permissions: ['storage', 'commands'],
    commands: {
      'open-search': {
        suggested_key: {
          default: 'Ctrl+Shift+Space',
          mac: 'Command+Shift+Space',
        },
        description: 'Open Search Bar'
      }
    },
    "host_permissions": [
      "*://*/*"
    ]
  },
  vite: () => ({
    plugins: [
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ]
  })
});
