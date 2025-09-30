import { OrganisationsTyp, RollenMerkmal, type RollenArt } from '@/api-client/generated';
import { Person } from './Person';
import { Zuordnung } from './Zuordnung';

type Rolle = { name: Zuordnung['rolle']; art: Zuordnung['rollenArt']; merkmale: Array<RollenMerkmal> };

export class PersonWithZuordnungen extends Person {
  public uniqueRollen: Map<Zuordnung['rolleId'], Rolle> = new Map();

  public administrationsebenen: Set<string> = new Set();

  public klassenZuordnungen: Set<string> = new Set();

  public constructor(
    person: Person,
    public zuordnungen: Array<Zuordnung>,
    public lastModifiedZuordnungen?: string,
  ) {
    super(
      person.id,
      person.name,
      person.referrer,
      person.revision,
      person.personalnummer,
      person.isLocked,
      person.userLock,
      person.lastModified,
      person.email,
    );
    for (const zuordnung of zuordnungen) {
      this.uniqueRollen.set(zuordnung.rolleId, {
        name: zuordnung.rolle,
        art: zuordnung.rollenArt,
        merkmale: zuordnung.merkmale,
      });
      if (zuordnung.typ !== OrganisationsTyp.Klasse) {
        if (zuordnung.sskDstNr !== null && zuordnung.sskDstNr !== '') {
          this.administrationsebenen.add(zuordnung.sskDstNr);
        } else {
          this.administrationsebenen.add(zuordnung.sskName);
        }
      } else {
        this.klassenZuordnungen.add(zuordnung.sskName);
      }
    }
  }

  public get rollenArten(): Set<RollenArt> {
    const rollenArten: Set<RollenArt> = new Set<RollenArt>();
    for (const rolle of this.uniqueRollen.values()) {
      rollenArten.add(rolle.art);
    }
    return rollenArten;
  }

  public get rollenAsString(): string {
    return this.stringifyArray(Array.from(this.uniqueRollen.values()).map((rolle: Rolle) => rolle.name));
  }

  public get administrationsebenenAsString(): string {
    return this.stringifyArray(Array.from(this.administrationsebenen.values()));
  }

  public get klassenZuordnungenAsString(): string {
    return this.stringifyArray(Array.from(this.klassenZuordnungen.values()));
  }

  public getPersonalnummerAsString(replacementForMissing: string = 'fehlt'): string {
    if (!this.personalnummer) {
      if (this.hasKopersRolle()) {
        return replacementForMissing;
      }
      return '---';
    }
    return this.personalnummer;
  }

  public hasKopersRolle(): boolean {
    for (const rolle of this.uniqueRollen.values()) {
      if (rolle.merkmale.includes(RollenMerkmal.KopersPflicht)) {
        return true;
      }
    }
    return false;
  }

  public stringifyArray(array: Array<string>): string {
    return array.length > 0 ? array.join(', ') : '---';
  }
}
