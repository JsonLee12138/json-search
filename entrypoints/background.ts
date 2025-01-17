import type { SearchPlatformItem } from "./global/types/type";
import { abortPromise, type AbortPromise } from 'jsonlee-promise';
import { url2base64, getBaseURL } from "./global/utils/url";
import { initSearchPlatforms } from "./global/utils/initSearchPlatforms";
import { storageInstance } from "./global/utils/storage";
import { StorageKey } from "./global/enum/storage";




const changeTabs = async () => {
  try {
    const searchPlatforms = await storageInstance.getItem(StorageKey.SEARCH_PLATFORMS);
    const noIcons: SearchPlatformItem[] = searchPlatforms.filter((item: SearchPlatformItem) => !item.icon && item.value !== 'add');
    if (noIcons.length) {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        const tab = tabs[0];
        if (tab) {
          const url = new URL(tab.url || '');
          const origin = url.origin;
          if (noIcons.some(item => item.url.includes(origin))) {
            let iconURL = tab.favIconUrl;
            try {
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
            storageInstance.setItem(StorageKey.SEARCH_PLATFORMS, newSearchPlatforms);
          }
        }
      })
    } else {
      return Promise.resolve();
    }
  } catch (error) {
    console.error(error)
  }
  // chrome.storage?.local.get(StorageKey.SEARCH_PLATFORMS, ({ searchPlatforms }) => {
  //   const noIcons: SearchPlatformItem[] = searchPlatforms.filter((item: SearchPlatformItem) => !item.icon && item.value !== 'add');
  //   if (noIcons.length) {
  //     chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
  //       const tab = tabs[0];
  //       if (tab) {
  //         const url = new URL(tab.url || '');
  //         const origin = url.origin;
  //         if (noIcons.some(item => item.url.includes(origin))) {
  //           let iconURL = tab.favIconUrl;
  //           try {
  //             iconURL = (await url2base64(tab.favIconUrl || '')) as string;
  //           } catch (e) {
  //             console.error('下载ico失败: ', e)
  //           }
  //           const newSearchPlatforms = searchPlatforms.map((item: SearchPlatformItem) => {
  //             if (!item.icon && item.url.includes(origin)) {
  //               return { ...item, icon: iconURL };
  //             }
  //             return item;
  //           })
  //           storageInstance.setItem(StorageKey.SEARCH_PLATFORMS, newSearchPlatforms);
  //         }
  //       }
  //     })
  //   } else {
  //     return Promise.resolve();
  //   }
  // });
}

const iconsSetup = async () => {
  const res = await initSearchPlatforms();
  const httpIcons = res.filter(item => item.icon && item.icon.startsWith('http'));
  if (httpIcons.length) {
    const fetchArr = httpIcons.map(async (item) => {
      const base64 = await url2base64(item.icon || '');
      return {
        ...item,
        icon: base64
      }
    })
    const icons = await Promise.all(fetchArr);
    const newSearchPlatforms = res.map(item => {
      if (item.icon && item.icon.startsWith('http')) {
        return {
          ...item,
          icon: icons.find(icon => icon.value === item.value)?.icon || item.icon
        }
      }
      return item;
    })
    storageInstance.setItem(StorageKey.SEARCH_PLATFORMS, newSearchPlatforms);
  }
}

const contextMenuSetup = async () => {
  const searchPlatforms = await initSearchPlatforms();
  console.log(searchPlatforms, 'searchPlatforms')
  for (const item of searchPlatforms) {
    chrome.contextMenus.create({
      id: item.value,
      title: item.label,
      type: 'normal',
      contexts: ['selection']
    })
  }
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    const clickItem = searchPlatforms.find(item => item.value === info.menuItemId);
    if (clickItem) {
      chrome.tabs.create({
        url: clickItem.url.replace('{keyword}', info.selectionText ? encodeURIComponent(info.selectionText) : '')
      })
    }
  })
}

const getUseSearchPlatform = async () => {
  const searchPlatforms = await initSearchPlatforms();
  if (!searchPlatforms.length) {
    return null;
  }
  const current = searchPlatforms.find(item => item.isDefault);
  if (!current) {
    return searchPlatforms[0];
  }
  return current;
}

const isNewTab = (tab: chrome.tabs.Tab) => {
  return tab.pendingUrl === 'chrome://newtab/' || !tab.url;
}
const onCreatedHandler = async (tab: chrome.tabs.Tab) => {
  if (isNewTab(tab) && true) {
    const searchPlatform = await getUseSearchPlatform();
    if (searchPlatform) {
      chrome.tabs.update(tab.id!, {
        url: getBaseURL(searchPlatform.url)
      })
    }
  }
}

export default defineBackground(() => {
  let promise: AbortPromise | null = null;
  iconsSetup();
  chrome.runtime.onInstalled.addListener(async () => {
    contextMenuSetup();
  })

  chrome.tabs.onActivated.addListener(() => {
    if (promise) {
      promise.abort();
    }
    const controller = new AbortController();
    promise = abortPromise(changeTabs, controller);
  })
  // chrome.tabs.onCreated.addListener(onCreatedHandler)
  chrome.commands.onCommand.addListener((command) => {
    if (command === 'open-search') {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs.length > 0) {
          const currentTab = tabs[0];
          if (currentTab?.id && currentTab.url?.startsWith('http')) {
            chrome.tabs.sendMessage(tabs[0].id!, { action: "open_search" });
          } else {
            const useSearchPlatform = await getUseSearchPlatform();
            if (useSearchPlatform) {
              chrome.tabs.create({ url: getBaseURL(useSearchPlatform.url) });
            } else {
              chrome.tabs.create({ url: 'https://www.google.com' });
            }
          }
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
        chrome.tabs.create({ url: getBaseURL(message.url) });
      })
    }
  })
});
