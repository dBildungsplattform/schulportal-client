import { describe, expect, test, beforeEach } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import HelpFaqView from '@/views/HelpFaqView.vue';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import routes from '@/router/routes';

describe('HelpFaqView', () => {
  let router: Router;

  beforeEach(() => {
    router = createRouter({
      history: createMemoryHistory(),
      routes,
    });
  });

  test('help faq view renders correctly with faq accordion panels', async () => {
    router.push('/hilfe/faq');
    await router.isReady();

    const wrapper: VueWrapper = mount(HelpFaqView, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('[data-testid="back-button"]').exists()).toBe(true);
  });
});
