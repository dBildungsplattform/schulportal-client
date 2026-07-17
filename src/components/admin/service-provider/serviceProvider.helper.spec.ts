import deDE from '@/locales/de-DE.json';
import { RollenArt } from '@/stores/RolleStore';
import { createI18n } from 'vue-i18n';
import { formatServiceProviderRollenartenWhitelist } from './serviceProvider.helper';

const i18n: { global: { t: (key: string) => unknown } } = createI18n({
  legacy: false,
  locale: 'de',
  messages: { de: deDE },
});

const t: (key: string) => string = (key: string): string => String(i18n.global.t(key));

describe('serviceProviderRollenarten', () => {
  test('formats non-empty whitelist using i18n labels', () => {
    const value: string = formatServiceProviderRollenartenWhitelist([RollenArt.Lern, RollenArt.Lehr], t);

    expect(value).toBe('Lern, Lehr');
  });

  test('formats empty whitelist as no restrictions', () => {
    const value: string = formatServiceProviderRollenartenWhitelist([], t);

    expect(value).toBe('Keine Einschränkungen');
  });
});
