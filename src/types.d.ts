export type TranslatedObject = {
  value: string;
  title: string;
};

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

declare type Option<T> = T | null | undefined;

export enum AvailableServicesEnum {
  TWO_FACTOR_AUTHENTICATION = '2FA',
}
