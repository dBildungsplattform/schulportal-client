import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import SchultraegerSuccessTemplate from './SchultraegerSuccessTemplate.vue';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(SchultraegerSuccessTemplate, {
    attachTo: document.getElementById('app') || '',
    props: {
      successMessage: 'Schultraeger updated successfully',
      followingDataChanged: 'The following data was changed',
      changedData: [{ label: 'Schultraeger Name', value: 'Test Schultraeger', testId: 'updated-schultraeger-name' }],
      backButtonText: 'Back to List',
      createAnotherButtonText: 'Create Another',
      showCreateAnotherButton: false,
      showBackButton: false,
      backButtonTestId: 'back-to-details-button',
      createAnotherButtonTestId: 'create-another-rolle-button',
    },
    global: {
      components: {
        SchultraegerSuccessTemplate,
      },
    },
  });
});

describe('SchultraegerSuccessTemplate', () => {
  test('it displays the success message and data correctly', () => {
    expect(wrapper?.get('[data-testid="schultraeger-success-text"]').text()).toBe('Schultraeger updated successfully');
  });
});
