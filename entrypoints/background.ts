import type { SearchPlatformItem } from "./global/types/type";
import { abortPromise, type AbortPromise } from 'jsonlee-promise';
import { url2base64 } from "./global/utils/url2base64";
import { initSearchPlatforms } from "./global/utils/initSearchPlatforms";

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
            let iconURL = tab.favIconUrl;
            try{
              iconURL = (await url2base64(tab.favIconUrl || '')) as string;
            } catch (e) {
              console.error('下载ico失败: ', e)
            }
            const newSearchPlatforms = searchPlatforms.map((item: SearchPlatformItem) => {
              if (!item.icon && item.url.includes(origin)) {
                return { ...item, icon: iconURL };
              }
              return item;
            })
            chrome.storage?.local.set({ searchPlatforms: newSearchPlatforms });
          }
        }
      })
    } else {
      return Promise.resolve();
    }
  });
}

const initIcons = async () => {
  const res = await initSearchPlatforms();
  const httpIcons = res.filter(item => item.icon && item.icon.startsWith('http'));
  if(httpIcons.length){
    const fetchArr = httpIcons.map(async (item) => {
      const base64 = await url2base64(item.icon || '');
      return {
        ...item,
        icon: base64
      }
    })
    const icons = await Promise.all(fetchArr);
    const newSearchPlatforms = res.map(item => {
      if(item.icon && item.icon.startsWith('http')){
        return {
          ...item,
          icon: icons.find(icon => icon.value === item.value)?.icon || item.icon
        }
      }
      return item;
    })
    chrome.storage?.local.set({ searchPlatforms: newSearchPlatforms });
  }
}
export default defineBackground(() => {
  let promise: AbortPromise | null = null;
  initIcons();
  chrome.tabs.onActivated.addListener(() => {
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
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'open_url') {
      chrome.tabs.query({}, (tabs) => {
        let url = new URL(message.url);
        for (const tab of tabs) {
          if (tab.url?.includes(url.origin)) {
            chrome.tabs.update(tab.id!, { active: true });
            return;
          }
        }
        chrome.tabs.create({ url: message.url?.replace('{keyword}', '').replace('search?q=', '') });
      })
    }
  })
});
