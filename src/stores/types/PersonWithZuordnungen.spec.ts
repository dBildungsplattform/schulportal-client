import { DoFactory } from '@/testing/DoFactory';
import { OrganisationsTyp, type Organisation } from '../OrganisationStore';
import { RollenArt, RollenMerkmal } from '../RolleStore';
import { Person } from './Person';
import { PersonWithZuordnungen } from './PersonWithZuordnungen';
import type { Zuordnung } from './Zuordnung';

describe('PersonWithZuordnungen', () => {
  let schule: Organisation;
  let person: Person;
  let zuordnungen: Array<Zuordnung>;
  let personWithZuordnungen: PersonWithZuordnungen;

  beforeEach(() => {
    schule = DoFactory.getSchule();
    person = DoFactory.getPerson();
    zuordnungen = [
      DoFactory.getZuordnung({ rollenArt: RollenArt.Lern }, { organisation: schule }),
      DoFactory.getZuordnung({ rollenArt: RollenArt.Lern, typ: OrganisationsTyp.Klasse, administriertVon: schule.id }),
      DoFactory.getZuordnung({ rollenArt: RollenArt.Lern, typ: OrganisationsTyp.Klasse, administriertVon: schule.id }),
      DoFactory.getZuordnung({ rollenArt: RollenArt.Lern, typ: OrganisationsTyp.Land, sskDstNr: null }),
    ];
    personWithZuordnungen = new PersonWithZuordnungen(person, zuordnungen);
  });

  it('should create a PersonWithZuordnungen instance', () => {
    expect(personWithZuordnungen).toBeInstanceOf(PersonWithZuordnungen);
    expect(personWithZuordnungen).toEqual(expect.objectContaining(person));
    expect(personWithZuordnungen.zuordnungen).toEqual(expect.arrayContaining(zuordnungen));
  });

  it('should return rollenArten', () => {
    const { rollenArten }: PersonWithZuordnungen = personWithZuordnungen;
    expect(rollenArten).toContain(RollenArt.Lern);
  });

  it('should return rollenAsString', () => {
    const { rollenAsString }: PersonWithZuordnungen = personWithZuordnungen;
    for (const zuordnung of zuordnungen) {
      expect(rollenAsString).toContain(zuordnung.rolle);
    }
  });

  it('should return administrationsebenenAsString and klassenZuordnungenAsString', () => {
    const { administrationsebenenAsString, klassenZuordnungenAsString }: PersonWithZuordnungen = personWithZuordnungen;
    for (const zuordnung of zuordnungen) {
      if (zuordnung.typ !== OrganisationsTyp.Klasse) {
        expect(administrationsebenenAsString).toContain(zuordnung.sskDstNr || zuordnung.sskName);
      } else {
        expect(klassenZuordnungenAsString).toContain(zuordnung.sskName);
      }
    }
  });

  it('should return personalnummerAsString', () => {
    const { personalnummerAsString }: PersonWithZuordnungen = personWithZuordnungen;
    expect(personalnummerAsString).toBe(person.personalnummer);
  });

  describe.each([[true], [false]])('when hasKopersRolle=%s', (hasKopersRolle: boolean) => {
    it('should return correct placeholder for empty personalnummer', () => {
      const zuordnung: Zuordnung = DoFactory.getZuordnung({
        rolle: 'Kopers',
        rollenArt: RollenArt.Lehr,
        merkmale: hasKopersRolle ? [RollenMerkmal.KopersPflicht] : [],
      });
      const personWithKopersZuordnung: PersonWithZuordnungen = new PersonWithZuordnungen(person, [zuordnung]);
      personWithKopersZuordnung.personalnummer = null;
      const { personalnummerAsString }: PersonWithZuordnungen = personWithKopersZuordnung;
      expect(personalnummerAsString).toContain(hasKopersRolle ? 'fehlt' : '---');
    });
  });
});
