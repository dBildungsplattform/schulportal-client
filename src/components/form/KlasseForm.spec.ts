import {
  OrganisationsTyp,
  useOrganisationStore,
  type Organisation,
  type OrganisationStore,
} from '@/stores/OrganisationStore';
import type { ValidationSchema as KlasseFormSchema } from '@/utils/validationKlasse';
import { VueWrapper, flushPromises, mount } from '@vue/test-utils';
import { expect, test, type Mock } from 'vitest';
import { nextTick } from 'vue';
import KlasseForm from './KlasseForm.vue';

const organisationStore: OrganisationStore = useOrganisationStore();

const initialValues: KlasseFormSchema = {
  selectedSchule: 'Ina-Initial-Schule',
  selectedKlassenname: '1a',
};
const newValues: KlasseFormSchema = {
  selectedSchule: 'Gerda-Geändert-Schule',
  selectedKlassenname: '9z',
};
const mountComponent = (props?: object): VueWrapper => {
  return mount(KlasseForm, {
    attachTo: document.getElementById('app') || '',
    props: {
      editMode: false,
      isLoading: false,
      onHandleConfirmUnsavedChanges: () => '',
      onHandleDiscard: () => '',
      onShowDialogChange: (value: boolean | undefined) => value,
      onSubmit: () => Promise.resolve(),
      ...props,
    },
    global: {
      components: {
        KlasseForm,
      },
    },
  });
};

describe('KlasseForm', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    organisationStore.$reset();
    organisationStore.schulenFilter.filterResult = [initialValues, newValues].map(
      ({ selectedSchule }: KlasseFormSchema): Organisation => ({
        id: selectedSchule,
        name: selectedSchule,
        typ: OrganisationsTyp.Schule,
      }),
    );
  });

  describe.each([[true], [false]])('when editMode is %s', (editMode: boolean) => {
    const defaultProps: object = {
      editMode,
      errorCode: '',
      initialValues,
    };

    test('it renders the Klasse form', () => {
      const wrapper: VueWrapper = mountComponent(defaultProps);
      expect(wrapper.find('[data-testid="klasse-form"]').isVisible()).toBe(true);
      expect(wrapper.find('#schule-select').isVisible()).toBe(true);
      expect(wrapper.find('#klassenname-input').isVisible()).toBe(true);
    });

    test('it does not render when there is an error', async () => {
      const wrapper: VueWrapper = mountComponent({
        ...defaultProps,
        errorCode: 'something',
      });
      expect(wrapper.find('[data-testid="klasse-form"]').exists()).toBe(true);
      expect(wrapper.find('#schule-select').exists()).toBe(false);
      expect(wrapper.find('#klassenname-input').exists()).toBe(false);
    });

    test('it contains initial values', () => {
      const wrapper: VueWrapper = mountComponent(defaultProps);
      expect(wrapper.find('[data-testid="klasse-form"]').isVisible()).toBe(true);
      expect(wrapper.find('[data-testid="schule-select"]').text()).toContain(initialValues.selectedSchule);
      expect(wrapper.find('#klassenname-input').attributes('value')).toBe(initialValues.selectedKlassenname);
    });

    test('it handles changing props', async () => {
      const wrapper: VueWrapper = mountComponent({
        ...defaultProps,
        isEditActive: false,
      });
      expect(wrapper.find('[data-testid="schule-select"]').text()).toContain(initialValues.selectedSchule);
      expect(wrapper.find('#klassenname-input').attributes('value')).toBe(initialValues.selectedKlassenname);

      await wrapper.setProps({ initialValues: newValues });
      expect(wrapper.find('[data-testid="schule-select"]').text()).toContain(newValues.selectedSchule);
      expect(wrapper.find('#klassenname-input').attributes('value')).toBe(newValues.selectedKlassenname);
    });

    test.runIf(editMode)('it correctly toggles editActive', async () => {
      const onHandleDiscard: Mock = vi.fn();
      const wrapper: VueWrapper = mountComponent({
        ...defaultProps,
        isEditActive: false,
        onHandleDiscard,
      });
      expect(wrapper.find('[data-testid="klasse-form-submit-button"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="klasse-form-discard-button"]').exists()).toBe(false);
      wrapper.setProps({ isEditActive: true });
      await nextTick();

      expect(wrapper.find('[data-testid="klasse-form-submit-button"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="klasse-form-discard-button"]').exists()).toBe(true);
      wrapper.find('[data-testid="klasse-form-discard-button"]').trigger('click');
      await nextTick();
    });

    test.runIf(editMode)('toggling isEditActive reinitializes fields', async () => {
      const wrapper: VueWrapper = mountComponent({
        ...defaultProps,
        isEditActive: false,
      });
      expect(wrapper.find('[data-testid="schule-select"]').text()).toContain(initialValues.selectedSchule);
      expect(wrapper.find('#klassenname-input').attributes('value')).toBe(initialValues.selectedKlassenname);
      await wrapper.setProps({ isEditActive: true });

      await wrapper.find('#klassenname-input').setValue(newValues.selectedKlassenname);
      expect(wrapper.find('#klassenname-input').attributes('value')).toBe(newValues.selectedKlassenname);

      await wrapper.setProps({ isEditActive: false });
      expect(wrapper.find('[data-testid="schule-select"]').text()).toContain(initialValues.selectedSchule);
      expect(wrapper.find('#klassenname-input').attributes('value')).toBe(initialValues.selectedKlassenname);
    });

    describe.each([[true], [false]])('when isEditActive is %s', (isEditActive: boolean) => {
      test('it dynamically displays actions', () => {
        const wrapper: VueWrapper = mountComponent({
          ...defaultProps,
          isEditActive,
        });
        if (editMode) {
          expect(wrapper.find('[data-testid="klasse-form-discard-button"]').exists()).toBe(isEditActive);
          expect(wrapper.find('[data-testid="klasse-form-submit-button"]').exists()).toBe(isEditActive);
        } else {
          expect(wrapper.find('[data-testid="klasse-form-discard-button"]').exists()).toBe(true);
          expect(wrapper.find('[data-testid="klasse-form-submit-button"]').exists()).toBe(true);
        }
      });

      test('it correctly sets "disabled"-attributes on inputs', () => {
        const wrapper: VueWrapper = mountComponent({ ...defaultProps, isEditActive });
        if (editMode) {
          expect(wrapper.find('#schule-select').attributes('disabled')).toBe('');
        } else {
          expect(wrapper.find('#schule-select').attributes('disabled')).toBeUndefined();
        }
        if (editMode && !isEditActive) expect(wrapper.find('#klassenname-input').attributes('disabled')).toBe('');
        else expect(wrapper.find('#klassenname-input').attributes('disabled')).toBeUndefined();
      });

      test('data-entry and submission are correctly en-/disabled', async () => {
        const wrapper: VueWrapper = mountComponent({
          ...defaultProps,
          isEditActive,
        });
        await wrapper.find('#schule-select').setValue(newValues.selectedSchule);
        await wrapper.find('#klassenname-input').setValue(newValues.selectedKlassenname);
        vi.runAllTimers();
        await flushPromises();
        if (editMode) {
          expect(wrapper.find('[data-testid="schule-select"]').text()).toContain(initialValues.selectedSchule);
          if (isEditActive) {
            expect(wrapper.find('#klassenname-input').attributes('value')).toBe(newValues.selectedKlassenname);
          } else {
            expect(wrapper.find('#klassenname-input').attributes('value')).toBe(initialValues.selectedKlassenname);
          }
        } else {
          expect(wrapper.find('#schule-select').attributes('value')).toContain(newValues.selectedSchule);
          expect(wrapper.find('#klassenname-input').attributes('value')).toBe(newValues.selectedKlassenname);
        }

        if (!editMode || isEditActive) {
          expect(wrapper.find('[data-testid="klasse-form-submit-button"]').attributes('disabled')).toBeFalsy();
        }
      });

      test('it correctly sets "disabled"-attributes on inputs', () => {
        const wrapper: VueWrapper = mountComponent({ ...defaultProps, isEditActive });
        if (editMode) {
          expect(wrapper.find('#schule-select').attributes('disabled')).toBe('');
        } else {
          expect(wrapper.find('#schule-select').attributes('disabled')).toBeUndefined();
        }
        if (editMode && !isEditActive) expect(wrapper.find('#klassenname-input').attributes('disabled')).toBe('');
        else expect(wrapper.find('#klassenname-input').attributes('disabled')).toBeUndefined();
      });
    });
  });
});
