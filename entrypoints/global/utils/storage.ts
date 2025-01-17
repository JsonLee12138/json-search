export class Storage {
  async getItem(key: string) {
    return await chrome.storage?.local.get(key).then(res => res[key]);
  }
  async setItem(key: string, value: any) {
    return await chrome.storage?.local.set({ [key]: value });
  }
  clear(){
    chrome.storage?.local.clear();
  }
  removeItem(key: string){
    chrome.storage?.local.remove(key);
  }
}

export const storageInstance = new Storage();
