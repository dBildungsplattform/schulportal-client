import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import InputRow from './InputRow.vue';
import { useForm, type BaseFieldProps, type TypedSchema } from 'vee-validate';
import { type Ref } from 'vue';
import type { CreateRolleBodyParamsMerkmaleEnum, CreateRolleBodyParamsRollenartEnum } from '@/stores/RolleStore';
import { object, string } from 'yup';
import { toTypedSchema } from '@vee-validate/yup';

let wrapper: VueWrapper | null = null;

const vuetifyConfig = (state: {
  errors: Array<string>;
}): { props: { error: boolean; 'error-messages': Array<string> } } => ({
  props: {
    error: !!state.errors.length,
    'error-messages': state.errors,
  },
});

type RolleCreationForm = {
  selectedSchulstrukturknoten: string;
  selectedRollenArt: CreateRolleBodyParamsRollenartEnum;
  selectedRollenName: string;
  selectedMerkmale: CreateRolleBodyParamsMerkmaleEnum[];
};

const validationSchema: TypedSchema = toTypedSchema(
  object({
    selectedRollenName: string()
      .max(200, 'Rollenname darf maximal 200 Zeichen lang sein')
      .required('Rollenname ist ein Pflichtfeld'),
  }),
);

// eslint-disable-next-line @typescript-eslint/typedef
const { defineField } = useForm<RolleCreationForm>({
  validationSchema: validationSchema,
});

const [testModel, testModelProps]: [
  Ref<string>,
  Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
] = defineField('selectedSchulstrukturknoten', vuetifyConfig);

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(InputRow, {
    attachTo: document.getElementById('app') || '',
    props: {
      id: 'test-input',
      errorLabel: "i'm an error",
      fieldProps: testModelProps,
      label: 'what a label',
      modelValue: testModel.value,
      placeholder: 'holding the place',
    },
    global: {
      components: {
        InputRow,
      },
    },
  });
});

describe('InputRow', () => {
  test.skip('it renders an input row', () => {
    expect(wrapper?.find('[data-testid="test-input"]').isVisible()).toBe(true);
  });
});
