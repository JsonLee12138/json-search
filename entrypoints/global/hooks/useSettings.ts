import { StorageKey } from "../enum/storage";
import { storageInstance } from "../utils/storage";
import { ref } from 'vue';

interface Settings {
  closeOnBlur: boolean;
}

const defaultSettings = {
  closeOnBlur: true,
}

export const useSettings = () => {
  const settings = ref<Settings>(defaultSettings);
  const setSettings = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    settings.value = {
      ...settings.value,
      [key]: value
    };
  }
  watch(() => settings.value, (value) => {
    storageInstance.setItem(StorageKey.SETTINGS, value);
  }, { deep: true })

  const watchStorageHandler = (changes: { [key: string]: chrome.storage.StorageChange; }) => {
    if (changes.hasOwnProperty(StorageKey.SETTINGS)) {
      const newValue = changes[StorageKey.SETTINGS].newValue;
      settings.value = newValue;
    }
  }
  onMounted(() => {
    storageInstance.getItem(StorageKey.SETTINGS).then(res => {
      let value = null;
      if (!res || Object.keys(res).length < Object.keys(defaultSettings).length) {
        value = { ...defaultSettings, ...(res || {}) };
        settings.value = value;
        storageInstance.setItem(StorageKey.SETTINGS, value);
        return;
      }
      settings.value = res;
    })
    chrome.storage.onChanged.addListener(watchStorageHandler);
  })
  onBeforeUnmount(() => {
    chrome.storage.onChanged.removeListener(watchStorageHandler);
  })

  return { set: setSettings, settings }
}
