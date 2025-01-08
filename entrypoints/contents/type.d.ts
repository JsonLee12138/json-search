export type SearchPlatformItem = {
  label: string;
  value: string;
  url: string;
  sort?: number;
  isDefault?: boolean;
  icon?: string;
}

export type MentionRef = {
  focus: () => void
}
