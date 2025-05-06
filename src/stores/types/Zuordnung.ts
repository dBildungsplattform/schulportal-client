import type { DBiamPersonenzuordnungResponse } from '@/api-client/generated';
import type { OrganisationsTyp } from '../OrganisationStore';
import type { RollenArt, RollenMerkmal } from '../RolleStore';

export class Zuordnung {
  public constructor(
    public sskId: string,
    public rolleId: string,
    public sskName: string,
    public sskDstNr: string,
    public rolle: string,
    public rollenArt: RollenArt,
    public administriertVon: string,
    public typ: OrganisationsTyp,
    public editable: boolean,
    public befristung: Date,
    public merkmale: RollenMerkmal,
    public admins: Array<string>,
  ) {}

  public static fromPersonenzuordnung(zuordnung: DBiamPersonenzuordnungResponse): Zuordnung {
    return new Zuordnung(
      zuordnung.sskId,
      zuordnung.rolleId,
      zuordnung.sskName,
      zuordnung.sskDstNr,
      zuordnung.rolle,
      zuordnung.rollenArt,
      zuordnung.administriertVon,
      zuordnung.typ,
      zuordnung.editable,
      new Date(zuordnung.befristung),
      zuordnung.merkmale,
      zuordnung.admins,
    );
  }
}
