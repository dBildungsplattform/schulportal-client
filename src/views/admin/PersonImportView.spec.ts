import { expect, test } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import PersonImportView from './PersonImportView.vue';
// import { nextTick } from 'vue';
// import { useImportStore, type ImportStore } from '@/stores/ImportStore';

let wrapper: VueWrapper | null = null;
// const importStore: ImportStore = useImportStore();

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(PersonImportView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        PersonImportView,
      },
      mocks: {
        route: {
          fullPath: 'full/path',
        },
      },
    },
  });
  vi.resetAllMocks();
});

describe('PersonImportView', () => {
  test('it renders the person import view', async () => {
    expect(wrapper?.find('[data-testid="person-import-card"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="schule-select"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="rolle-select"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="file-input"]').isVisible()).toBe(true);
  });
});
