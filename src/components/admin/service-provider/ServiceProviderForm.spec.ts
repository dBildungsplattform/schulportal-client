import { OrganisationsTyp } from '@/api-client/generated';
import { useOrganisationStore, type Organisation, type OrganisationStore } from '@/stores/OrganisationStore';
import { RollenSystemRecht } from '@/stores/RolleStore';
import { ServiceProviderKategorie } from '@/stores/ServiceProviderStore';
import { DOMWrapper, flushPromises, mount, VueWrapper } from '@vue/test-utils';
import { DoFactory } from 'test/DoFactory';
import { beforeEach, describe, expect, test, vi, type Mock } from 'vitest';
import type { ComponentInstance } from 'vue';
import ServiceProviderForm from './ServiceProviderForm.vue';
import type {
  ServiceProviderFormProps,
  ServiceProviderFormSubmitData,
  ServiceProviderForm as ServiceProviderFormType,
} from './types';

const defaultProps: ServiceProviderFormProps = {
  initialValues: {
    selectedOrganisationId: '',
    name: '',
    url: '',
    logoId: undefined,
    kategorie: ServiceProviderKategorie.Schulisch,
    nachtraeglichZuweisbar: true,
    verfuegbarFuerRollenerweiterung: true,
    requires2fa: false,
  },
  systemrecht: RollenSystemRecht.AngeboteVerwalten,
  showUnsavedChangesDialog: false,
  loading: false,
  isEditMode: false,
};

function mountComponent(
  props: Partial<ServiceProviderFormProps> = {},
): VueWrapper<ComponentInstance<typeof ServiceProviderForm>> {
  return mount(ServiceProviderForm, {
    props: { ...defaultProps, ...props },
  });
}

describe('ServiceProviderForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('renders all main form sections', () => {
    const wrapper: VueWrapper<ComponentInstance<typeof ServiceProviderForm>> = mountComponent();
    expect(wrapper.find('[data-testid="name-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="url-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="kategorie-select"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="nachtraeglich-zuweisbar-select"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="verfuegbar-fuer-rollenerweiterung-select"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="requires2fa-select"]').exists()).toBe(true);
  });

  test('validates required fields', async () => {
    const wrapper: VueWrapper<ComponentInstance<typeof ServiceProviderForm>> = mountComponent();
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();
    await vi.waitFor(() => {
      expect(wrapper.html()).toContain('Der Name des Angebots muss angegeben werden.');
      expect(wrapper.html()).toContain('Die URL des Angebots muss angegeben werden.');
      expect(wrapper.html()).toContain('Die Ebene der Bereitstellung muss ausgewählt werden.');
    });
  });

  test('clicking test url button calls window.open', async () => {
    const openSpy: Mock = vi.spyOn(window, 'open').mockImplementation(() => null);
    const wrapper: VueWrapper<ComponentInstance<typeof ServiceProviderForm>> = mountComponent({
      initialValues: { ...defaultProps.initialValues, url: 'example.com' },
    });
    await wrapper.find('[data-testid="url-test-button"]').trigger('click');
    expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
  });

  type FieldState = {
    testId: string;
    isEditMode: boolean;
    shouldBeDisabled: boolean;
  };

  const fieldStates: FieldState[] = [
    { testId: 'name-input', isEditMode: false, shouldBeDisabled: false },
    { testId: 'url-input', isEditMode: false, shouldBeDisabled: false },
    { testId: 'kategorie-select', isEditMode: false, shouldBeDisabled: false },
    { testId: 'nachtraeglich-zuweisbar-select', isEditMode: false, shouldBeDisabled: false },
    { testId: 'verfuegbar-fuer-rollenerweiterung-select', isEditMode: false, shouldBeDisabled: false },
    { testId: 'requires2fa-select', isEditMode: false, shouldBeDisabled: true },
    { testId: 'name-input', isEditMode: true, shouldBeDisabled: false },
    { testId: 'url-input', isEditMode: true, shouldBeDisabled: false },
    { testId: 'kategorie-select', isEditMode: true, shouldBeDisabled: false },
    { testId: 'nachtraeglich-zuweisbar-select', isEditMode: true, shouldBeDisabled: true },
    { testId: 'verfuegbar-fuer-rollenerweiterung-select', isEditMode: true, shouldBeDisabled: true },
    { testId: 'requires2fa-select', isEditMode: true, shouldBeDisabled: true },
  ];

  test.each(fieldStates)(
    'field $testId is disabled=$shouldBeDisabled when isEditMode=$isEditMode',
    ({ testId, isEditMode, shouldBeDisabled }: FieldState): void => {
      const wrapper: VueWrapper<ComponentInstance<typeof ServiceProviderForm>> = mountComponent({ isEditMode });
      const attr: string | undefined = wrapper.find(`[data-testid="${testId}"] input`).attributes('disabled');
      if (shouldBeDisabled) {
        expect(attr).toBeDefined();
      } else {
        expect(attr).toBeUndefined();
      }
    },
  );

  test('emits correct payload on submit', async () => {
    const orgaStore: OrganisationStore = useOrganisationStore();
    const org: Organisation = DoFactory.getOrganisation({ typ: OrganisationsTyp.Schule });
    orgaStore.organisationenFilters.set('service-provider-create', {
      filterResult: [org],
      loading: false,
      total: 1,
    });
    const initialValues: ServiceProviderFormType = {
      selectedOrganisationId: org.id,
      name: 'Test Name',
      url: 'https://test-url.com',
      kategorie: ServiceProviderKategorie.Schulisch,
      logoId: undefined,
      nachtraeglichZuweisbar: true,
      verfuegbarFuerRollenerweiterung: true,
      requires2fa: false,
    };
    const newName: string = 'Updated Name';
    const newUrl: string = 'updated-url.com';

    const wrapper: VueWrapper<ComponentInstance<typeof ServiceProviderForm>> = mountComponent({ initialValues });
    await flushPromises();
    const schuleAutoComplete: ReturnType<VueWrapper['findComponent']> = wrapper
      .findComponent({ name: 'SchulenFilter' })
      .findComponent({
        name: 'v-autocomplete',
      });
    await schuleAutoComplete.setValue(org.id);
    // vi.runAllTimers();
    await flushPromises();

    await wrapper.find('input[id="name-input"]').setValue(newName);
    await wrapper.find('input[id="url-input"]').setValue(newUrl);

    const submitBtn: DOMWrapper<Element> = wrapper.find(
      '[data-testid="service-provider-create-form"] button[type="submit"]',
    );
    expect(submitBtn.exists()).toBe(true);
    expect(submitBtn.attributes()['disabled']).toBeUndefined();
    await submitBtn.trigger('click');
    // submit event is not triggered by click in test, so we trigger it manually
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    wrapper.findComponent({ name: 'FormWrapper' }).vm['onSubmit']();
    await flushPromises();

    expect(wrapper.emitted('click:submit')).toBeTruthy();
    const emittedData: ServiceProviderFormSubmitData = wrapper
      .emitted('click:submit')
      ?.at(0)
      ?.at(0) as ServiceProviderFormSubmitData;
    expect(emittedData).toMatchObject({
      name: newName,
      url: `https://${newUrl}`,
      selectedOrganisation: org,
      kategorie: initialValues.kategorie,
      logoId: initialValues.logoId,
    });
  });
});
