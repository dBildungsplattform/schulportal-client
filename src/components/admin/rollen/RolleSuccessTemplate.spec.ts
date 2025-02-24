import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import RolleSuccessTemplate from './RolleSuccessTemplate.vue';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(RolleSuccessTemplate, {
    attachTo: document.getElementById('app') || '',
    props: {
      successMessage: 'Role updated successfully',
      followingRolleDataCreated: 'The following data was created',
      createdRolleData: [
        { label: 'Role Name', value: 'Test Role', testId: 'updated-rolle-name' },
        { label: 'Merkmale', value: 'Merkmal 1, Merkmal 2', testId: 'updated-rolle-merkmale' },
        { label: 'Assigned Service Providers', value: 'Service Provider 1', testId: 'updated-rolle-angebote' },
        { label: 'System Rights', value: 'Systemrecht 1', testId: 'updated-rolle-systemrechte' },
      ],
      backButtonText: 'Back to List',
      createAnotherRolleButtonText: 'Create Another',
      showCreateAnotherRolleButton: true,
      backButtonTestId: 'back-to-details-button',
      createAnotherButtonTestId: 'create-another-rolle-button',
    },
    global: {
      components: {
        RolleSuccessTemplate,
      },
    },
  });
});

describe('RolleSuccessTemplate', () => {
  test('it displays the success message and data correctly', () => {
    expect(wrapper?.get('[data-testid="rolle-success-text"]').text()).toBe('Role updated successfully');
  });
});
