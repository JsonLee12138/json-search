import i18n from "../global/locale";

export type TabValue = 'help' | 'list' | 'settings';
export type TabItem = {
  label: string;
  value: TabValue;
}

export const tabs: TabItem[] = [
  {
    label: i18n.global.t('help.title'),
    value: 'help',
  },
  {
    label: i18n.global.t('searchList'),
    value: 'list',
  },
  {
    label: i18n.global.t('settings.title'),
    value: 'settings',
  },
]
