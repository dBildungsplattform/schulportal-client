import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import SuccessTemplate from './SuccessTemplate.vue';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(SuccessTemplate, {
    attachTo: document.getElementById('app') || '',
    props: {
      successMessage: 'Klasse updated successfully',
      followingDataCreated: 'The following data was created',
      createdData: [{ label: 'Administrationsebene', value: 'Test ebene', testId: 'updated-administrationsebene' }],
      backButtonText: 'Back to List',
      createAnotherButtonText: 'Create Another',
      showCreateAnotherButton: true,
      backButtonTestId: 'back-to-details-button',
      createAnotherButtonTestId: 'create-another-klasse-button',
    },
    global: {
      components: {
        SuccessTemplate,
      },
    },
  });
});

describe('SuccessTemplate', () => {
  test('it displays the success message and data correctly', () => {
    expect(wrapper?.get('[data-testid="klasse-success-text"]').text()).toBe('Klasse updated successfully');
  });
});
