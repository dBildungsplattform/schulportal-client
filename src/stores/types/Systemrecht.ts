import type { RollenSystemRechtEnum } from '@/api-client/generated/api';

export class SystemRecht {
  private readonly nameInternal: RollenSystemRechtEnum;

  private readonly technical: boolean;

  public constructor(name: RollenSystemRechtEnum, technical: boolean) {
    this.nameInternal = name;
    this.technical = technical;
  }

  public get name(): RollenSystemRechtEnum {
    return this.nameInternal;
  }

  public get isTechnical(): boolean {
    return this.technical;
  }
}
