import {
  EmailAddressStatus,
  OrganisationsTyp,
  RollenArt,
  RollenMerkmal,
  RollenSystemRecht,
  TraegerschaftTyp,
  Vertrauensstufe,
  type DBiamPersonenuebersichtResponse,
  type DBiamPersonenzuordnungResponse,
  type OrganisationResponse,
  type PersonendatensatzResponse,
  type PersonenkontextRolleFieldsResponse,
  type PersonResponse,
  type RollenSystemRechtServiceProviderIDResponse,
  type UserinfoResponse,
} from '@/api-client/generated';
import type { Organisation } from '@/stores/OrganisationStore';
import type { Person } from '@/stores/types/Person';
import { PersonWithZuordnungen } from '@/stores/types/PersonWithZuordnungen';
import type { Zuordnung } from '@/stores/types/Zuordnung';
// eslint-disable-next-line import/no-extraneous-dependencies
import { faker } from '@faker-js/faker';

export class DoFactory {
  public static getPersonWithZuordnung(
    person?: Partial<Person>,
    zuordnungen?: Array<Zuordnung>,
  ): PersonWithZuordnungen {
    return new PersonWithZuordnungen(this.getPerson(person), zuordnungen ?? [this.getZuordnung()]);
  }

  public static getPerson(props?: Partial<Person>): Person {
    return {
      id: faker.string.uuid(),
      name: {
        vorname: faker.person.firstName(),
        familienname: faker.person.lastName(),
      },
      referrer: faker.internet.username(),
      revision: faker.string.numeric(2),
      personalnummer: faker.string.numeric(7),
      isLocked: false,
      userLock: null,
      lastModified: new Date().toISOString(),
      email: {
        status: EmailAddressStatus.Enabled,
        address: faker.internet.email(),
      },
      ...props,
    };
  }

  public static getZuordnung(props?: Partial<Zuordnung>, nested?: { organisation: Partial<Organisation> }): Zuordnung {
    const schule: Organisation = DoFactory.getSchule(nested?.organisation);
    return {
      administriertVon: schule.administriertVon!,
      befristung: faker.date.soon(),
      admins: [faker.person.fullName()],
      editable: true,
      sskId: schule.id,
      rolleId: faker.string.uuid(),
      sskName: schule.name,
      sskDstNr: schule.kennung!,
      rolle: faker.string.alpha(5),
      rollenArt: faker.helpers.arrayElement<RollenArt>([RollenArt.Lern, RollenArt.Lehr]),
      merkmale: {} as RollenMerkmal,
      typ: schule.typ,
      ...props,
    };
  }

  public static getPersonResponse(props?: Partial<PersonResponse>): PersonResponse {
    return {
      id: faker.string.uuid(),
      name: {
        vorname: faker.person.firstName(),
        familienname: faker.person.lastName(),
      },
      referrer: faker.internet.username(),
      revision: faker.string.numeric(2),
      personalnummer: faker.string.numeric(7),
      isLocked: false,
      userLock: null,
      lastModified: new Date().toISOString(),
      email: {
        status: EmailAddressStatus.Enabled,
        address: faker.internet.email(),
      },
      mandant: faker.string.uuid(),
      geburt: {
        datum: faker.date.birthdate().toISOString(),
        geburtsort: faker.location.city(),
      },
      stammorganisation: faker.string.uuid(),
      geschlecht: faker.person.gender(),
      lokalisierung: faker.location.language().alpha2,
      startpasswort: faker.string.alpha(10),
      vertrauensstufe: Vertrauensstufe.Voll,
      ...props,
    };
  }

  public static getPersonendatensatzResponse(props?: Partial<PersonResponse>): PersonendatensatzResponse {
    return {
      person: this.getPersonResponse(props),
    };
  }

  public static getSchule(props?: Partial<Organisation>): Organisation {
    return {
      id: faker.string.uuid(),
      name: `${faker.person.firstName()}-${faker.person.lastName()}-Schule`,
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
    nested?: {
      organisation?: Organisation;
    },
  ): DBiamPersonenuebersichtResponse {
    const zuordnung: DBiamPersonenzuordnungResponse = DoFactory.getDBiamPersonenzuordnungResponse(
      {},
      { organisation: nested?.organisation },
    );
    return {
      personId: faker.string.uuid(),
      vorname: faker.person.firstName(),
      nachname: faker.person.lastName(),
      benutzername: faker.internet.username(),
      lastModifiedZuordnungen: faker.date.recent().toISOString(),
      zuordnungen: [zuordnung],
      ...props,
    };
  }

  public static getDBiamPersonenzuordnungResponse(
    props?: Partial<DBiamPersonenzuordnungResponse>,
    nested?: {
      organisation?: Organisation;
    },
  ): DBiamPersonenzuordnungResponse {
    const organisation: Organisation = DoFactory.getSchule(nested?.organisation);
    return {
      sskId: organisation.id,
      rolleId: faker.string.uuid(),
      sskName: organisation.name,
      sskDstNr: organisation.kennung!,
      rolle: faker.string.alpha(5),
      rollenArt: RollenArt.Lern,
      administriertVon: faker.string.uuid(),
      typ: organisation.typ,
      editable: true,
      befristung: faker.date.soon().toISOString(),
      merkmale: {} as RollenMerkmal,
      admins: [faker.person.fullName()],
      ...props,
    };
  }
}
