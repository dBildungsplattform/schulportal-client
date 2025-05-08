import type { PersonResponse } from '@/api-client/generated';
import { parseUserLock, type UserLock } from '@/utils/lock';

export class Person {
  public constructor(
    public id: PersonResponse['id'],
    public name: PersonResponse['name'],
    public referrer: PersonResponse['referrer'],
    public revision: PersonResponse['revision'],
    public personalnummer: PersonResponse['personalnummer'],
    public isLocked: PersonResponse['isLocked'],
    public userLock: UserLock[] | null,
    public lastModified: PersonResponse['lastModified'],
    public email: PersonResponse['email'],
  ) {}

  public static fromResponse(response: PersonResponse): Person {
    return new Person(
      response.id,
      response.name,
      response.referrer,
      response.revision,
      response.personalnummer,
      response.isLocked,
      parseUserLock(response.userLock ?? []),
      response.lastModified,
      response.email,
    );
  }
}
