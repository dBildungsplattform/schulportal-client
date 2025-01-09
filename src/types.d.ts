export type TranslatedObject = {
  value: string;
  title: string;
};

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};
