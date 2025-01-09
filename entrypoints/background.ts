import type { SearchPlatformItem } from "./global/types/type";
import { abortPromise, type AbortPromise } from 'jsonlee-promise';

const validateIcon = async (url: string) => {
  try {
    const res = await fetch(url);
    return res.ok;
  } catch (error) {
    return false;
  }
}
const changeTabs = async () => {
  chrome.storage?.local.get('searchPlatforms', ({ searchPlatforms }) => {
    const noIcons: SearchPlatformItem[] = searchPlatforms.filter((item: SearchPlatformItem) => !item.icon && item.value !== 'add');
    if (noIcons.length) {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        const tab = tabs[0];
        if (tab) {
          const url = new URL(tab.url || '');
          const origin = url.origin;
          if (noIcons.some(item => item.url.includes(origin))) {
            let iconPath = 'favicon.ico';
            chrome.tabs.sendMessage(tab.id!, { action: "get_icon" }, {},
              async (res) => {
                if (res && res.iconPath) {
                  iconPath = res.iconPath;
                }
                let iconURL = iconPath;
                if (!iconPath.startsWith('http')) {
                  if (iconPath.startsWith('/')) {
                    iconURL = `${origin}${iconPath}`;
                  } else {
                    iconURL = `${origin}/${iconPath}`;
                  }
                }
                const isValid = await validateIcon(iconURL);
                if (isValid) {
                  const newSearchPlatforms = searchPlatforms.map((item: SearchPlatformItem) => {
                    if (!item.icon && item.url.includes(origin)) {
                      return { ...item, icon: iconURL };
                    }
                    return item;
                  })
                  chrome.storage?.local.set({ searchPlatforms: newSearchPlatforms });
                  return Promise.resolve();
                }
              });
          }
        }
      })
    } else {
      return Promise.resolve();
    }
  });

}
export default defineBackground(() => {
  let promise: AbortPromise | null = null;
  chrome.tabs.onActivated.addListener((e) => {
    if (promise) {
      promise.abort();
    }
    const controller = new AbortController();
    promise = abortPromise(changeTabs, controller);
  })
  chrome.commands.onCommand.addListener((command) => {
    if (command === 'open-search') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id!, { action: "open_search" });
        }
      });
    }
  });
});
