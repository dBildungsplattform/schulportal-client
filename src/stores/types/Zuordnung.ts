import type { DBiamPersonenzuordnungResponse } from '@/api-client/generated';
import type { OrganisationsTyp } from '../OrganisationStore';
import type { RollenArt, RollenMerkmal } from '../RolleStore';

export class Zuordnung {
  public constructor(
    public sskId: string,
    public rolleId: string,
    public sskName: string,
    public sskDstNr: string | null,
    public rolle: string,
    public rollenArt: RollenArt,
    public administriertVon: string,
    public typ: OrganisationsTyp,
    public editable: boolean,
    public befristung: Date | null,
    public merkmale: Array<RollenMerkmal>,
    public admins: Array<string>,
  ) {}

  public static fromResponse(response: DBiamPersonenzuordnungResponse): Zuordnung {
    return new Zuordnung(
      response.sskId,
      response.rolleId,
      response.sskName,
      response.sskDstNr,
      response.rolle,
      response.rollenArt,
      response.administriertVon,
      response.typ,
      response.editable,
      response.befristung ? new Date(response.befristung) : null,
      response.merkmale,
      response.admins ? response.admins : [],
    );
  }
}
