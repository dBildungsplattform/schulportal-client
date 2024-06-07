import { expect, test } from 'vitest';
import { VueWrapper, flushPromises, mount } from '@vue/test-utils';
import SchuleCreationView from './SchuleCreationView.vue';
import { setActivePinia, createPinia } from 'pinia';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import routes from '@/router/routes';
import { nextTick } from 'vue';

let wrapper: VueWrapper | null = null;
let router: Router;

beforeEach(async () => {
  setActivePinia(createPinia());
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  router = createRouter({
    history: createWebHistory(),
    routes,
  });

  router.push('/');
  await router.isReady();

  wrapper = mount(SchuleCreationView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        SchuleCreationView,
      },
      plugins: [router],
    },
  });
});

describe('SchuleCreationView', () => {
  test('it renders the schule form', () => {
    expect(wrapper?.find('[data-testid="dienststellennummer-input"]').isVisible()).toBe(true);
  });

  test('it renders all child components', () => {
    expect(wrapper?.getComponent({ name: 'LayoutCard' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'SpshAlert' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormWrapper' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormRow' })).toBeTruthy();
  });

  test('it fills the schule creation form', async () => {
    const dienststellennummerInput: VueWrapper | undefined = wrapper?.findComponent({ ref: 'dienststellennummer-input' });
    await dienststellennummerInput?.setValue('9356494');
    await nextTick();

    const schulnameInput: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schulname-input' });
    await schulnameInput?.setValue('Random Schulname Gymnasium');
    await nextTick();
    await flushPromises();

    // TODO: meaningfully expand this test

    wrapper?.find('[data-testid="close-layout-card-button"]').trigger('click');
    await nextTick();

    // const unsavedChangesDialog: VueWrapper | undefined = wrapper?.findComponent({ ref: 'unsaved-changes-dialog' });
    // console.log('****', unsavedChangesDialog);
  });
});
