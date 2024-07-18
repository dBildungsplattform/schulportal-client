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
      successMessage: 'Role updated successfully',
      followingDataCreated: 'The following data was created',
      createdData: [
        { label: 'Role Name', value: 'Test Role', testId: 'updated-rolle-name' },
        { label: 'Merkmale', value: 'Merkmal 1, Merkmal 2', testId: 'updated-rolle-merkmale' },
        { label: 'Assigned Service Providers', value: 'Service Provider 1', testId: 'updated-rolle-angebote' },
        { label: 'System Rights', value: 'Systemrecht 1', testId: 'updated-rolle-systemrecht' },
      ],
      backButtonText: 'Back to List',
      createAnotherButtonText: 'Create Another',
      showCreateAnotherButton: true,
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
    expect(wrapper?.get('[data-testid="success-text"]').text()).toBe('Role updated successfully');
  });
});
