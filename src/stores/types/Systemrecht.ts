import type { RollenSystemRechtEnum } from '@/api-client/generated/api';

export type SystemRechtType = {
  readonly name: RollenSystemRechtEnum;
  readonly isTechnical: boolean;
};
