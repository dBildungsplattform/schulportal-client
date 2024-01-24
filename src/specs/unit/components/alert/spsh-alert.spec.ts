import SpshAlert from '@/components/alert/SpshAlert.vue'
import { expect, test } from 'vitest'
import { VueWrapper, mount } from '@vue/test-utils'
import { nextTick } from 'vue';

let wrapper: VueWrapper | null = null

beforeEach(() => {
    document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `

    wrapper = mount(SpshAlert, {
      props: {
        showAlert: true,
        title: 'Alert title',
        text: 'This is the text of the alert',
        showButton: false,
        buttonText: '',
        type: 'error' ,
        closable: true
      },

      global: {
        components: {
          SpshAlert
        }
      }
    });
  });

describe('SpshAlert Alert', () => {
  test('it renders the alert when showAlert is true', () => {
    expect(wrapper?.find('.v-alert').isVisible()).toBe(true);
  });

  test('it does render the button when showButton is true', () => {
    wrapper?.setProps({ showAlert: true, showButton: true });
    expect(wrapper?.find('.v-btn').isVisible()).toBe(true);
  });
  
  test('it does not render the button when showButon is false', async() => {
    wrapper?.setProps({ showAlert: true, closable:false, showButton: false });
    console.log(wrapper?.html())
    await nextTick();  // Wait for Vue to update the DOM
    expect(wrapper?.find('.v-btn').exists()).toBe(false);
  });

  test('it does render the correct text', async() => {
    wrapper?.setProps({ showAlert: true, closable:false, text: 'Test Alert' });
    await nextTick(); 
    expect(wrapper?.text()).toContain('Test Alert');
  });
})
  