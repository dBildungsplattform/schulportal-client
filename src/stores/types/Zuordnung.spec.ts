import type { DBiamPersonenzuordnungResponse } from '@/api-client/generated';
import { DoFactory } from 'test/DoFactory';
import { Zuordnung } from './Zuordnung';

describe('Zuordnung', () => {
  describe('fromResponse', () => {
    it('should create a Zuordnung instance from a DBiamPersonenzuordnungResponse', () => {
      const response: DBiamPersonenzuordnungResponse = DoFactory.getDBiamPersonenzuordnungResponse();
      const zuordnung: Zuordnung = Zuordnung.fromResponse(response);
      expect(zuordnung).toBeInstanceOf(Zuordnung);

      const expectedProperties: Partial<DBiamPersonenzuordnungResponse> = { ...response };
      delete expectedProperties.befristung;
      expect(zuordnung).toEqual(expect.objectContaining(expectedProperties));
      expect(zuordnung.befristung).toEqual(response.befristung ?? '');
    });

    it('should set nullable fields', () => {
      const response: DBiamPersonenzuordnungResponse = DoFactory.getDBiamPersonenzuordnungResponse();
      response.befristung = null;
      response.admins = null;
      const zuordnung: Zuordnung = Zuordnung.fromResponse(response);

      expect(zuordnung.befristung).toBeNull();
      expect(zuordnung.admins).toEqual([]);
    });
  });
});
