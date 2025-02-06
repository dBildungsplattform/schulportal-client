import { expect, test } from 'vitest';
import { nextTick } from 'vue';
import { VueWrapper, mount } from '@vue/test-utils';
import itsLearningSetup from './itsLearningSetup.vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import routes from '@/router/routes';

let wrapper: VueWrapper;
let router: Router;

async function initWrapper(props: InstanceType<typeof itsLearningSetup>['$props']): Promise<void> {
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

  wrapper = mount(itsLearningSetup, {
    attachTo: document.getElementById('app') || '',
    props,
    global: {
      components: {
        itsLearningSetup,
      },
      plugins: [router],
    },
  });
}

describe('itsLearningSetup', () => {
  beforeEach(async () => {
    await initWrapper({
      errorCode: '',
      schulId: '1',
      schulname: 'schule',
      itslearningEnabled: false,
    });
  });

  test('it opens and closes the dialog via buttons', async () => {
    wrapper.find('[data-testid="open-schule-itslearning-sync-dialog-icon"]').trigger('click');
    await nextTick();

    await document.querySelector('[data-testid="schule-activate-in-itslearning-confirmation-text"]');
    expect(document.querySelector('[data-testid="schule-activate-in-itslearning-confirmation-text"]')).not.toBeNull();

    const cancelDeleteButton: HTMLElement | undefined = document.querySelectorAll<HTMLElement>(
      '[data-testid="cancel-schule-activate-in-itslearning-dialog-button"]',
    )[0];
    cancelDeleteButton?.click();
    await nextTick();

    expect(document.querySelector('[data-testid="close-schule-sync-itslearning-dialog-button"]')).toBeNull();
  });

  test('should emit onActivateItslearning event', async () => {
    wrapper.find('[data-testid="open-schule-itslearning-sync-dialog-icon"]').trigger('click');
    await nextTick();

    const syncButton: HTMLButtonElement | null = await document.querySelector<HTMLButtonElement>(
      '[data-testid="schule-itslearning-sync-button"]',
    );
    expect(syncButton).not.toBeNull();

    syncButton?.click();
    await nextTick();

    expect(wrapper.emitted('onActivateItslearning')?.[0]).toEqual(['1']);
  });

  test('should open success dialog', async () => {
    wrapper.find('[data-testid="open-schule-itslearning-sync-dialog-icon"]').trigger('click');
    await nextTick();

    document.querySelector<HTMLButtonElement>('[data-testid="schule-itslearning-sync-button"]')?.click();
    await nextTick();

    const successDialogCloseButton: HTMLButtonElement | null = document.querySelector(
      '[data-testid="close-schule-sync-itslearning-dialog-button"]',
    );
    expect(successDialogCloseButton).not.toBeNull();

    successDialogCloseButton?.click();
    await nextTick();
  });
});

describe('itsLearningSetup retransmit', () => {
  beforeEach(async () => {
    await initWrapper({
      errorCode: '',
      schulId: '1',
      schulname: 'schule',
      itslearningEnabled: true,
    });
  });

  test('it opens and closes the dialog via buttons', async () => {
    wrapper.find('[data-testid="open-schule-itslearning-resync-dialog-icon"]').trigger('click');
    await nextTick();

    await document.querySelector('[data-testid="schule-retransmit-in-itslearning-confirmation-text"]');
    expect(document.querySelector('[data-testid="schule-retransmit-in-itslearning-confirmation-text"]')).not.toBeNull();

    const cancelDeleteButton: HTMLElement | undefined = document.querySelectorAll<HTMLElement>(
      '[data-testid="cancel-schule-activate-in-itslearning-dialog-button"]',
    )[0];
    cancelDeleteButton?.click();
    await nextTick();

    expect(document.querySelector('[data-testid="close-schule-sync-itslearning-dialog-button"]')).toBeNull();
  });

  test('should emit onActivateItslearning event', async () => {
    wrapper.find('[data-testid="open-schule-itslearning-resync-dialog-icon"]').trigger('click');
    await nextTick();

    const syncButton: HTMLButtonElement | null = await document.querySelector<HTMLButtonElement>(
      '[data-testid="schule-itslearning-sync-button"]',
    );
    expect(syncButton).not.toBeNull();

    syncButton?.click();
    await nextTick();

    expect(wrapper.emitted('onActivateItslearning')?.[0]).toEqual(['1']);
  });

  test('should open success dialog', async () => {
    wrapper.find('[data-testid="open-schule-itslearning-resync-dialog-icon"]').trigger('click');
    await nextTick();

    document.querySelector<HTMLButtonElement>('[data-testid="schule-itslearning-sync-button"]')?.click();
    await nextTick();

    const successDialogCloseButton: HTMLButtonElement | null = document.querySelector(
      '[data-testid="close-schule-sync-itslearning-dialog-button"]',
    );
    expect(successDialogCloseButton).not.toBeNull();

    successDialogCloseButton?.click();
    await nextTick();
  });
});
