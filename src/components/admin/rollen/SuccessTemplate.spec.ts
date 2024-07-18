import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import SuccessTemplate from './SuccessTemplate.vue';
import { computed, type ComputedRef } from 'vue';
import { useRolleStore, type RolleStore } from '@/stores/RolleStore';

let wrapper: VueWrapper | null = null;

const rolleStore: RolleStore = useRolleStore();

const translatedUpdatedRolleMerkmale: ComputedRef<string> = computed(() => 'Merkmal 1');
const translatedUpdatedAngebote: ComputedRef<string> = computed(() => 'Service Provider 1');
const translatedUpdatedSystemrecht: ComputedRef<string> = computed(() => 'Systemrecht 1');

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(SuccessTemplate, {
    attachTo: document.getElementById('app') || '',
    props: {
      rolleStore,
      translatedUpdatedRolleMerkmale,
      translatedUpdatedAngebote,
      translatedUpdatedSystemrecht,
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
    expect(wrapper?.get('[data-testid="rolle-success-text"]').text()).toBe('Die Rolle wurde erfolgreich geändert.');
  });
});
