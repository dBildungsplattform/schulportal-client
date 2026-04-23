export type TranslatedObject = {
  value: string;
  title: string;
};

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

declare type Option<T> = T | null | undefined;

declare type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };
