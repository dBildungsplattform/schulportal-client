import {
  OrganisationsTyp,
  RollenArt,
  RollenMerkmal,
  RollenSystemRecht,
  TraegerschaftTyp,
  type DBiamPersonenuebersichtResponse,
  type DBiamPersonenzuordnungResponse,
  type OrganisationResponse,
  type PersonenkontextRolleFieldsResponse,
  type RollenSystemRechtServiceProviderIDResponse,
  type UserinfoResponse,
} from '@/api-client/generated';
import type { Organisation } from '@/stores/OrganisationStore';
import type { Zuordnung } from '@/stores/PersonenkontextStore';
// eslint-disable-next-line import/no-extraneous-dependencies
import { faker } from '@faker-js/faker';

export class DoFactory {
  private static getFakeSchuleName(): string {
    return `${faker.person.firstName()}-${faker.person.lastName()}-Schule`;
  }

  public static getSchule(props?: Partial<Organisation>): Organisation {
    return {
      id: faker.string.uuid(),
      name: DoFactory.getFakeSchuleName(),
      kennung: faker.string.numeric(7),
      typ: OrganisationsTyp.Schule,
      administriertVon: faker.string.uuid(),
      ...props,
    };
  }

  public static getKlasse(parentSchule?: Organisation, props?: Partial<Organisation>): Organisation {
    const name: string = props?.name ?? `${faker.string.numeric(2)}${faker.string.alpha(1)}`;
    return {
      id: faker.string.uuid(),
      name,
      kennung: `${parentSchule?.kennung ?? faker.string.numeric(7)}-${name}`,
      namensergaenzung: 'Klasse',
      kuerzel: faker.string.alpha(4),
      typ: OrganisationsTyp.Klasse,
      administriertVon: parentSchule?.id ?? faker.string.uuid(),
      ...props,
    };
  }

  public static getOrganisationResponse(props?: Partial<OrganisationResponse>): OrganisationResponse {
    return {
      ...DoFactory.getSchule(),
      // eslint-disable-next-line no-underscore-dangle
      traegerschaft: TraegerschaftTyp._01,
      administriertVon: faker.string.uuid(),
      zugehoerigZu: faker.string.uuid(),
      kennung: faker.string.numeric(7),
      kuerzel: 'Schulkürzel',
      itslearningEnabled: true,
      namensergaenzung: null,
      version: 1,
      ...props,
    };
  }

  public static getUserinfoResponse(props?: Partial<UserinfoResponse>): UserinfoResponse {
    const gender: string = faker.person.gender();
    const firstName: string = faker.person.firstName();
    const lastName: string = faker.person.lastName();
    return {
      personId: faker.string.uuid(),
      email: faker.internet.email({ firstName, lastName }),
      email_verified: true,
      family_name: lastName,
      given_name: firstName,
      middle_name: faker.person.middleName(),
      nickname: faker.internet.displayName({ firstName, lastName }),
      profile: null,
      picture: null,
      phone_number: faker.phone.number(),
      website: faker.internet.url(),
      gender,
      birthdate: faker.date.birthdate().toISOString(),
      zoneinfo: null,
      locale: faker.location.countryCode(),
      updated_at: faker.date.past().toISOString(),
      password_updated_at: faker.date.past().toISOString(),
      acr: 'gold',
      timeLimits: [],
      name: faker.person.fullName({ firstName, lastName }),
      preferred_username: faker.internet.displayName({ firstName, lastName }),
      sub: faker.string.uuid(),
      personenkontexte: [
        {
          organisation: this.getOrganisationResponse(),
          rolle: {
            systemrechte: ['ROLLEN_VERWALTEN', 'SCHULEN_VERWALTEN', 'IMPORT_DURCHFUEHREN', 'PERSON_SYNCHRONISIEREN'],
            serviceProviderIds: ['789897798'],
          },
        },
      ],
      ...props,
    };
  }

  public static getPersonenkontextRolleFieldsResponse(
    props?: Partial<PersonenkontextRolleFieldsResponse>,
  ): PersonenkontextRolleFieldsResponse {
    return {
      organisation: this.getOrganisationResponse(),
      rolle: this.getRollenSystemRechtServiceProviderIDResponse(),
      ...props,
    };
  }

  public static getRollenSystemRechtServiceProviderIDResponse(
    props?: Partial<RollenSystemRechtServiceProviderIDResponse>,
  ): RollenSystemRechtServiceProviderIDResponse {
    return {
      systemrechte: [
        RollenSystemRecht.RollenVerwalten,
        RollenSystemRecht.SchulenVerwalten,
        RollenSystemRecht.ImportDurchfuehren,
        RollenSystemRecht.PersonSynchronisieren,
      ],
      serviceProviderIds: [faker.string.uuid()],
      ...props,
    };
  }

  public static getDBiamPersonenuebersichtResponse(
    props?: Partial<DBiamPersonenuebersichtResponse>,
  ): DBiamPersonenuebersichtResponse {
    return {
      personId: faker.string.uuid(),
      vorname: faker.person.firstName(),
      nachname: faker.person.lastName(),
      benutzername: faker.internet.username(),
      lastModifiedZuordnungen: faker.date.recent().toISOString(),
      zuordnungen: [],
      ...props,
    };
  }

  public static getDBiamPersonenzuordnungResponse(
    props?: Partial<DBiamPersonenzuordnungResponse>,
  ): DBiamPersonenzuordnungResponse {
    return {
      sskId: faker.string.uuid(),
      sskName: DoFactory.getFakeSchuleName(),
      sskDstNr: faker.string.numeric(7),
      rolleId: faker.string.uuid(),
      rolle: faker.string.alpha(4),
      rollenArt: RollenArt.Lehr,
      befristung: faker.date.future().toISOString(),
      administriertVon: faker.string.uuid(),
      editable: true,
      merkmale: [] as unknown as RollenMerkmal,
      admins: [faker.person.fullName()],
      typ: OrganisationsTyp.Schule,
      ...props,
    };
  }

  public static getZuordnung(props?: Partial<Zuordnung>): Zuordnung {
    return {
      sskId: faker.string.uuid(),
      rolleId: faker.string.uuid(),
      sskName: DoFactory.getFakeSchuleName(),
      sskDstNr: faker.string.numeric(7),
      rolle: faker.string.alpha(4),
      rollenArt: RollenArt.Lehr,
      befristung: faker.date.future().toISOString(),
      klasse: undefined,
      administriertVon: faker.string.uuid(),
      editable: true,
      merkmale: [] as unknown as RollenMerkmal,
      typ: OrganisationsTyp.Schule,
      ...props,
    };
  }
}
