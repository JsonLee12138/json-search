export type DefaultSelectOption = {
  label: string;
  value: string;
}

export class MentionValue {
  tags: string[] = [];
  value: string = '';
  prepend: string = '';
  constructor(defaultValue: Partial<MentionValue> = {}){
    Object.assign(this, defaultValue);
  }
};

export type SelectOptionUse<T = DefaultSelectOption> = T & {
  label: string;
  value: string;
  icon?: string;
}

export type MentionRef = {
  focus: () => void
}
