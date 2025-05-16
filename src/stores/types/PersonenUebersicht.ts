import type {
  DBiamPersonenuebersichtResponse,
  DBiamPersonenzuordnungResponse,
  RollenMerkmal,
} from '@/api-client/generated';
import { Zuordnung } from './Zuordnung';

/**
 * @deprecated Prefer {@link PersonWithZuordnungen}
 */
export class PersonenUebersicht {
  public constructor(
    public personId: string,
    public vorname: string,
    public nachname: string,
    public benutzername: string,
    public lastModifiedZuordnungen: string | null,
    public zuordnungen: Array<Zuordnung>,
  ) {}

  public static fromResponse(response: DBiamPersonenuebersichtResponse): PersonenUebersicht {
    return new PersonenUebersicht(
      response.personId,
      response.vorname,
      response.nachname,
      response.benutzername,
      response.lastModifiedZuordnungen,
      response.zuordnungen.map((zuordnung: DBiamPersonenzuordnungResponse) => Zuordnung.fromResponse(zuordnung)),
    );
  }

  public hasRollenMerkmale(merkmale: Array<RollenMerkmal>): boolean {
    const uniqueMerkmale: Set<RollenMerkmal> = new Set(
      this.zuordnungen.flatMap((zuordnung: Zuordnung) => zuordnung.merkmale),
    );
    return merkmale.every((merkmal: RollenMerkmal) => uniqueMerkmale.has(merkmal));
  }
}
