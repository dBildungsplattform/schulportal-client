import { expect, test } from 'vitest';
import { nextTick } from 'vue';
import { VueWrapper, mount } from '@vue/test-utils';
import itsLearningSetup from './itsLearningSetup.vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import routes from '@/router/routes';

let wrapper: VueWrapper | null = null;
let router: Router;

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

  router.push('/');
  await router.isReady();

  wrapper = mount(itsLearningSetup, {
    attachTo: document.getElementById('app') || '',
    props: {
      errorCode: '',
      schulId: '1',
      schulname: 'schule',
      itslearningEnabled: false,
    },
    global: {
      components: {
        itsLearningSetup,
      },
      plugins: [router],
    },
  });
});

describe('itsLearningSetup', () => {
  test('it opens and closes the dialog via buttons', async () => {
    wrapper?.find('[data-testid="open-schule-itslearning-sync-dialog-icon"]').trigger('click');
    await nextTick();

    await document.querySelector('[data-testid="schule-activate-in-itslearning-confirmation-text"]');
    expect(document.querySelector('[data-testid="schule-activate-in-itslearning-confirmation-text"]')).not.toBeNull();

    const cancelDeleteButton: HTMLElement | undefined = document.querySelectorAll<HTMLElement>(
      '[data-testid="cancel-schule-activate-in-itslearning-dialog-button"]',
    )[0];
    cancelDeleteButton?.click();
    await nextTick();

    expect(document.querySelector('[data-testid="cancel-schule-activate-in-itslearning-dialog-button"]')).toBeNull();
  });
});
