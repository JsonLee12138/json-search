import { defineConfig } from 'wxt';

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
  }
});
