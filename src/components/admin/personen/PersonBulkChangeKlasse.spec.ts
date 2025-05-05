import routes from '@/router/routes';
import { OperationType, useBulkOperationStore, type BulkOperationStore } from '@/stores/BulkOperationStore';
import type { Organisation } from '@/stores/OrganisationStore';
import { DoFactory } from '@/testing/DoFactory';
import type { TranslatedObject } from '@/types';
import { faker } from '@faker-js/faker';
import { DOMWrapper, VueWrapper, mount } from '@vue/test-utils';
import type WrapperLike from '@vue/test-utils/dist/interfaces/wrapperLike';
import type { MockInstance } from 'vitest';
import { nextTick } from 'vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import PersonBulkChangeKlasse from './PersonBulkChangeKlasse.vue';

let router: Router;
const bulkOperationStore: BulkOperationStore = useBulkOperationStore();
const mockPersonIds: string[] = [faker.string.uuid(), faker.string.uuid(), faker.string.uuid(), faker.string.uuid()];
const mockSchule: Organisation = DoFactory.getSchule();
const mockKlassen: Array<Organisation> = [
  DoFactory.getKlasse(mockSchule),
  DoFactory.getKlasse(mockSchule),
  DoFactory.getKlasse(mockSchule),
  DoFactory.getKlasse(mockSchule),
];
const mockAvailableKlassen: Array<TranslatedObject> = mockKlassen.map((klasse: Organisation) => ({
  value: klasse.id,
  title: klasse.name,
}));

type Props = {
  selectedSchuleId?: string;
  selectedPersonIds?: string[];
  availableKlassen?: TranslatedObject[];
};

function mountComponent(partialProps: Partial<Props> = {}): VueWrapper {
  const props: Props = {
    selectedSchuleId: mockSchule.id,
    selectedPersonIds: mockPersonIds,
    availableKlassen: mockAvailableKlassen,
    ...partialProps,
  };

  return mount(PersonBulkChangeKlasse, {
    attachTo: document.getElementById('app') || '',
    props,
    global: {
      plugins: [router],
    },
  });
}

beforeEach(async () => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  router = createRouter({
    history: createWebHistory(),
    routes,
  });

  await router.push('/');
  await router.isReady();

  bulkOperationStore.$reset();
  bulkOperationStore.resetState();
  vi.restoreAllMocks();
});

describe('PersonBulkPasswordReset', () => {
  test('commit button should be disabled initially', async () => {
    const wrapper: VueWrapper = mountComponent();
    await nextTick();
    const button: DOMWrapper<HTMLButtonElement> = wrapper.find('[data-testid="bulk-change-klasse-button"]');
    expect(button.exists()).toBe(true);
    expect(button.attributes('disabled')).toBeDefined();
  });

  test('button should be enabled when a new klasse is selected', async () => {
    const wrapper: VueWrapper = mountComponent();
    await nextTick();
    await wrapper.findComponent('[data-testid="bulk-change-klasse-select"]').setValue(mockKlassen[0]!.id);
    const button: DOMWrapper<HTMLButtonElement> = wrapper.find('[data-testid="bulk-change-klasse-button"]');
    expect(button.attributes('disabled')).not.toBeDefined();
  });

  test('clicking the button should call the bulkOperationStore', async () => {
    const spy: MockInstance = vi.spyOn(bulkOperationStore, 'bulkChangeKlasse');
    const wrapper: VueWrapper = mountComponent();
    await nextTick();

    expect(spy).not.toHaveBeenCalled();

    await wrapper.findComponent('[data-testid="bulk-change-klasse-select"]').setValue(mockKlassen[0]!.id);
    const button: DOMWrapper<HTMLButtonElement> = wrapper.find('[data-testid="bulk-change-klasse-button"]');
    await button.trigger('click');

    expect(spy).toHaveBeenCalledWith(mockPersonIds, mockSchule.id, mockKlassen[0]!.id);
  });

  describe('when operation is progressing', () => {
    beforeEach(() => {
      bulkOperationStore.currentOperation = {
        type: OperationType.CHANGE_KLASSE,
        isRunning: true,
        progress: 50,
        complete: false,
        errors: new Map(),
        data: new Map(),
      };
    });

    test('the progress template should be displayed', async () => {
      const wrapper: VueWrapper = mountComponent();
      await nextTick();

      const successMessageElement: WrapperLike = wrapper.find('[data-testid="bulk-change-klasse-success-text"]');
      expect(successMessageElement.exists()).toBe(false);

      const progressingNoticeElement: WrapperLike = wrapper.find(
        '[data-testid="bulk-change-klasse-progressing-notice"]',
      );
      expect(progressingNoticeElement.exists()).toBe(true);

      const progressBarElement: WrapperLike = wrapper.find('[data-testid="bulk-change-klasse-progressbar"]');
      expect(progressBarElement.exists()).toBe(true);
      expect(progressBarElement.text()).toContain('50%');
    });

    test('the success template should not be displayed', async () => {
      const wrapper: VueWrapper = mountComponent();
      await nextTick();

      const successMessageElement: WrapperLike = wrapper.find('[data-testid="bulk-change-klasse-success-text"]');
      expect(successMessageElement.exists()).toBe(false);
    });
  });

  describe('when operation is complete', () => {
    beforeEach(() => {
      bulkOperationStore.currentOperation = {
        type: OperationType.CHANGE_KLASSE,
        isRunning: false,
        progress: 100,
        complete: true,
        errors: new Map(),
        data: new Map(),
      };
    });

    test('the success template should be displayed', async () => {
      const wrapper: VueWrapper = mountComponent();
      await nextTick();

      const successMessageElement: WrapperLike = wrapper.find('[data-testid="bulk-change-klasse-success-text"]');
      expect(successMessageElement.exists()).toBe(true);
    });

    test('clicking the close-button should reset the bulkOperationStore', async () => {
      const spy: MockInstance = vi.spyOn(bulkOperationStore, 'resetState');
      const wrapper: VueWrapper = mountComponent();
      await nextTick();

      expect(spy).not.toHaveBeenCalled();

      const button: DOMWrapper<HTMLButtonElement> = wrapper.find('[data-testid="bulk-change-klasse-close-button"]');
      await button.trigger('click');

      expect(spy).toHaveBeenCalledOnce();
    });
  });
});
