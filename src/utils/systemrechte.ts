import { RollenSystemRecht } from '@/api-client/generated';

export function isHiddenSystemrecht(enumValue: RollenSystemRecht): boolean {
  return enumValue == RollenSystemRecht.CronDurchfuehren || enumValue == RollenSystemRecht.PersonenLesen;
}
