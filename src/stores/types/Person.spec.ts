// write tests for the constructor and fromResponse method
import type { PersonResponse } from '@/api-client/generated';
import { Person } from './Person';
import { DoFactory } from 'test/DoFactory';

describe('Person', () => {
  describe('fromResponse', () => {
    it('should set referrer to empty string, if it is null', () => {
      const response: PersonResponse = DoFactory.getPersonResponse();
      response.referrer = null;
      const person: Person = Person.fromResponse(response);
      expect(person.referrer).toBe('');
    });

    it('should set userLock to empty array, if it is null', () => {
      const response: PersonResponse = DoFactory.getPersonResponse();
      response.userLock = null;
      const person: Person = Person.fromResponse(response);
      expect(person.userLock).toEqual([]);
    });
  });
});
