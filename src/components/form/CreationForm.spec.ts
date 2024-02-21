import { expect, test } from 'vitest'
import { VueWrapper, mount } from '@vue/test-utils'
import CreationForm from './CreationForm.vue'
import type { TypedSchema } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import { object, string } from 'yup'
import { useI18n, type Composer } from 'vue-i18n'

let wrapper: VueWrapper | null = null

const { t }: Composer = useI18n({ useScope: 'global' })

const validationSchema: TypedSchema = toTypedSchema(
  object({
    selectedVorname: string()
      .matches(/^[A-Za-z]*[A-Za-z][A-Za-z0-9- ]*$/, t('admin.person.rules.vorname.matches'))
      .min(2, t('admin.person.rules.vorname.min'))
      .required(t('admin.person.rules.vorname.required')),
    selectedFamilienname: string().required(t('admin.person.rules.familienname.required'))
  })
)

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `

  wrapper = mount(CreationForm, {
    attachTo: document.getElementById('app') || '',
    props: {
      testId: 'test-creation-form',
      validationSchema
    },
    global: {
      components: {
        CreationForm
      }
    }
  })
})

describe('CreationForm', () => {
  test('it renders the creation form', () => {
    expect(wrapper?.find('[data-testid="test-creation-form"]').isVisible()).toBe(true)
  })
})
