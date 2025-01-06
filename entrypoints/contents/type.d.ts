export type SearchPlatform = {
  title: string;
  url: string;
}

export type SearchPlatformItem = SearchPlatform & {
  realValue: string;
  label: string;
  value: string;
}
