import type { EmailAddressStatus, PersonResponse } from '@/api-client/generated';
import { parseUserLock, type UserLock } from '@/utils/lock';

export class Person {
  public constructor(
    public id: string,
    public name: { vorname: string; familienname: string },
    public referrer: string,
    public revision: string,
    public personalnummer: string | null,
    public isLocked: boolean | null,
    public userLock: UserLock[],
    public lastModified: string,
    public email: {
      address: string;
      status: EmailAddressStatus;
    } | null,
  ) {}

  public static fromResponse(response: PersonResponse): Person {
    return new Person(
      response.id,
      response.name,
      response.referrer ?? '',
      response.revision,
      response.personalnummer,
      response.isLocked,
      parseUserLock(response.userLock ?? []),
      response.lastModified,
      response.email,
    );
  }
}
