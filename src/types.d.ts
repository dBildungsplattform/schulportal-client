import type { Organisation } from '@/stores/OrganisationStore';

export type SelectedSchulen = Organisation[] | Organisation | null | undefined;

export type TranslatedObject = {
  value: string;
  title: string;
};

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

declare type Option<T> = T | null | undefined;
