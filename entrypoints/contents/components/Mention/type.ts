import type { ReduceNodeConfig } from 'chatarea';

export interface DefaultSelectOption {
  label: string;
  value: string;
}

export class MentionValue {
  value: string = '';
  prepend: string = '';
  constructor(defaultValue: Partial<MentionValue> = {}) {
    Object.assign(this, defaultValue);
  }
};

export type SelectOptionUse<T = DefaultSelectOption> = T & {
  label: string;
  value: string;
  icon?: string;
  default?: boolean;
};

export interface MentionRef {
  focus: () => void;
  getValue: () => string;
}
