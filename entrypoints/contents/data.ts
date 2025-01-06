import type { SearchPlatform, SearchPlatformItem } from "./type";

export const defaultSearchPlatformMap = new Map<string, SearchPlatform>(
  [
    ['google', { title: 'Google', url: 'https://google.com/search?q={keyword}' }],
    ['bing', { title: 'Bing', url: 'https://bing.com/search?q={keyword}' }],
    ['baidu', { title: 'Baidu', url: 'https://www.baidu.com/s?ie=utf-8&f=8&rsv_bp=1&rsv_idx=1&tn=baidu&wd={keyword}' }],
    ['github', { title: 'Github', url: 'https://github.com/search?q={keyword}' }],
    ['stackoverflow', { title: 'Stack Overflow', url: 'https://stackoverflow.com/search?q={keyword}' }],
    ['npm', { title: 'NPM', url: 'https://npmjs.com/search?q={keyword}' }],
  ]
)

export const addSearchPlatform = {
  title: '新增',
  url: '',
  realValue: 'add',
  label: '新增',
  value: '新增',
}

export const getSearchPlatformsArray = (data: Map<string, SearchPlatform>): SearchPlatformItem[] => {
  return Array.from(data.keys()).map((key) => {
    const platform = data.get(key)!;
    const title = (platform?.title ?? key);
    return {
      ...platform,
      label: title,
      value: title,
      realValue: key,
    };
  });
}

export const addSearchRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  url: [{ required: true, message: '请输入搜索地址', trigger: 'blur' }],
};
