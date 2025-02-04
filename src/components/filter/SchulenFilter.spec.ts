import { OrganisationsTyp, useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
import { mount, type VueWrapper } from '@vue/test-utils';
import SchulenFilter from './SchulenFilter.vue';
import type { MockInstance } from 'vitest';
import { nextTick } from 'vue';

const organisationStore: OrganisationStore = useOrganisationStore();

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;
  organisationStore.$reset();
});

describe('SchulenFilter', async () => {
  test.each([[true], [false]])('it renders with multiple=%s', (multiple: boolean) => {
    const wrapper: VueWrapper = mount(SchulenFilter, {
      attachTo: document.getElementById('app') || '',
      props: {
        multiple,
      },
    });
    expect(wrapper.find('[data-testid="schule-select"]').isVisible()).toBe(true);
  });
  describe('it disables input', () => {
    function expectInputDisabledAttrToBe(expected: boolean): void {
      const inputElement: Element | null = document.querySelector('#schule-select');
      expect(inputElement).not.toBeNull();
      expect(inputElement!.hasAttribute('disabled')).toBe(expected);
    }
    test('when schule is autoselected', async () => {
      const wrapper: VueWrapper = mount(SchulenFilter, {
        attachTo: document.getElementById('app') || '',
        props: {
          multiple: false,
        },
      });
      expectInputDisabledAttrToBe(false);
      organisationStore.autoselectedSchule = { id: 'gcrnwaoeu', name: 'testschule', typ: OrganisationsTyp.Schule };
      await nextTick();
      await nextTick();
      expectInputDisabledAttrToBe(true);
    });
    test('when in readonly-mode', async () => {
      const wrapper: VueWrapper = mount(SchulenFilter, {
        attachTo: document.getElementById('app') || '',
        props: {
          multiple: false,
          readonly: false,
        },
      });
      expectInputDisabledAttrToBe(false);
      wrapper.setProps({ readonly: true });
      await nextTick();
      expectInputDisabledAttrToBe(true);
    });
  });
  test('it initializes', async () => {
    const resetSpy: MockInstance = vi.spyOn(organisationStore, 'resetSchulFilter');
    const autoselectSpy: MockInstance = vi.spyOn(organisationStore, 'getAutoselectedSchule');
    const loadSpy: MockInstance = vi.spyOn(organisationStore, 'loadSchulenForFilter');
    const wrapper: VueWrapper = mount(SchulenFilter, {
      attachTo: document.getElementById('app') || '',
    });
    expect(wrapper.find('[data-testid="schule-select"]').isVisible()).toBe(true);
    await nextTick();
    expect(resetSpy).toHaveBeenCalledOnce();
    expect(autoselectSpy).toHaveBeenCalledOnce();
    expect(loadSpy).toHaveBeenCalledOnce();
  });
});
