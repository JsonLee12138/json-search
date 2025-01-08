import type { SearchPlatformItem } from "./type";

export const addSearchPlatform: SearchPlatformItem = {
  label: '新增',
  value: 'add',
  url: '',
}

export const defaultSearchPlatforms = [
  {
    label: '百度',
    value: 'baidu',
    url: 'https://www.baidu.com/s?ie=utf-8&f=8&rsv_bp=1&rsv_idx=1&tn=baidu&wd={keyword}',
    icon: 'https://www.baidu.com/favicon.ico'
  },
  {
    label: 'Google',
    value: 'google',
    url: 'https://google.com/search?q={keyword}',
    isDefault: true,
    icon: 'https://www.google.com/favicon.ico'
  },
  {
    label: 'Stack Overflow',
    value: 'stackoverflow',
    url: 'https://stackoverflow.com/search?q={keyword}',
    icon: 'https://stackoverflow.com/favicon.ico'
  },
  {
    label: 'Github',
    value: 'github',
    url: 'https://github.com/search?q={keyword}',
    icon: 'https://github.com/favicon.ico'
  },
  {
    label: 'NPM',
    value: 'npm',
    url: 'https://npmjs.com/search?q={keyword}',
    icon: 'https://static-production.npmjs.com/b0f1a8318363185cc2ea6a40ac23eeb2.png'
  },
  {
    label: 'Bing',
    value: 'bing',
    url: 'https://bing.com/search?q={keyword}',
    icon: 'https://www.bing.com/favicon.ico'
  },
  {
    label: 'Bing 国内版',
    value: 'bing-cn',
    url: 'https://www.bing.com?mkt=zh-CN&q={keyword}',
    icon: 'https://www.bing.com/favicon.ico'
  },
  {
    label: 'Go',
    value: 'go',
    url: 'https://pkg.go.dev/search?q={keyword}',
    icon: 'https://pkg.go.dev/favicon.ico'
  }
];

export const addSearchRules = {
  label: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  url: [{ required: true, message: '请输入搜索地址', trigger: 'blur' }],
};
