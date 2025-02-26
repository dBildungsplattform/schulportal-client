import {
  OrganisationsTyp,
  TraegerschaftTyp,
  type OrganisationResponse,
  type UserinfoResponse,
} from '@/api-client/generated';
import type { Organisation } from '@/stores/OrganisationStore';
import { randomUUID } from 'crypto';
import { faker } from '@faker-js/faker';

export class DoFactory {
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

  public static getOrganisationResponse(props?: Partial<OrganisationResponse>): OrganisationResponse {
    return {
      ...DoFactory.getSchule(),
      // eslint-disable-next-line no-underscore-dangle
      traegerschaft: TraegerschaftTyp._01,
      administriertVon: faker.string.uuid(),
      kennung: faker.string.numeric(7),
      kuerzel: 'Schulkürzel',
      itslearningEnabled: true,
      namensergaenzung: null,
      version: 1,
      ...props,
    };
  }

  public static getUserinfoResponse(props?: Partial<UserinfoResponse>): UserinfoResponse {
    return {
      personId: randomUUID(),
      email: 'albert@test.de',
      email_verified: true,
      family_name: 'Test',
      given_name: 'Albert',
      middle_name: null,
      nickname: null,
      profile: null,
      picture: null,
      phone_number: null,
      website: null,
      gender: null,
      birthdate: null,
      zoneinfo: null,
      locale: null,
      updated_at: null,
      password_updated_at: null,
      acr: 'gold',
      timeLimits: [],
      name: 'Albert Test',
      preferred_username: 'albert',
      sub: 'c71be903-d0ec-4207-b653-40c114680b63',
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

  private static getRandomNumber(options?: { length: number }): string {
    return String(Math.round(Math.random() * Math.pow(10, options?.length ?? 8)));
  }
}
