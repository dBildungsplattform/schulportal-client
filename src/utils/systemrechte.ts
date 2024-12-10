import { RollenSystemRecht } from '@/api-client/generated';

export function hideSystemrecht(enumValue: RollenSystemRecht): boolean {
  return (
    enumValue == RollenSystemRecht.MigrationDurchfuehren ||
    enumValue == RollenSystemRecht.CronDurchfuehren ||
    enumValue == RollenSystemRecht.PersonenLesen
  );
}
