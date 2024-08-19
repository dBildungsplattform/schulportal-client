import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import PersonLock from './PersonLock.vue';
import type { Person, Personendatensatz } from '@/stores/PersonStore';

let wrapper: VueWrapper | null = null;
function getPersonendatensatz(locked: boolean): Personendatensatz {
  const person: Person = {
    id: 'testid',
    name: {
      familienname: 'tester',
      vorname: 'theo',
    },
    referrer: null,
    personalnummer: null,
    isLocked: locked,
    attributes: locked
      ? {
          lock_locked_from: 'Amanda Admin',
          lock_timestamp: Date.now().toString(),
        }
      : undefined,
  };
  return { person };
}

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;
});

describe('Lock user', () => {
  beforeEach(() => {
    wrapper = mount(PersonLock, {
      attachTo: document.getElementById('app') || '',
      props: {
        errorCode: '',
        person: getPersonendatensatz(false),
        adminId: 'adminid',
      },
      global: {
        components: {
          PersonLock,
        },
      },
    });
  });
  test('it opens the dialog', async () => {
    wrapper?.get('[data-testid="open-lock-dialog-icon"]').trigger('click');
    await document.querySelector('[data-testid="lock-user-info-text"]');
    expect(document.querySelector('[data-testid="lock-user-info-text"]')).not.toBeNull();
  });
});

describe('Unlock user', () => {
  beforeEach(() => {
    wrapper = mount(PersonLock, {
      attachTo: document.getElementById('app') || '',
      props: {
        errorCode: '',
        person: getPersonendatensatz(true),
        adminId: 'adminid',
      },
      global: {
        components: {
          PersonLock,
        },
      },
    });
  });
  test('it opens the dialog', async () => {
    wrapper?.get('[data-testid="open-lock-dialog-icon"]').trigger('click');
    await document.querySelector('[data-testid="lock-user-info-text"]');
    expect(document.querySelector('[data-testid="lock-user-info-text"]')).not.toBeNull();
  });
});
