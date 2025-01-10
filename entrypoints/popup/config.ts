export type TabValue = 'help' | 'list' | 'settings';
export type TabItem = {
  label: string;
  value: TabValue;
}

export const tabs: TabItem[] = [
  {
    label: '帮助',
    value: 'help',
  },
  {
    label: '列表',
    value: 'list',
  },
  {
    label: '设置',
    value: 'settings',
  },
]
