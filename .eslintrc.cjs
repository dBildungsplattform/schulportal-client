/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  'extends': [
    'airbnb-typescript/base',
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:vue/vue3-essential',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier/skip-formatting'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    parser: '@typescript-eslint/parser',
    project: ['./tsconfig.json', './tsconfig.app.json', './tsconfig.node.json']
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: ['./tsconfig.json', './tsconfig.app.json', './tsconfig.node.json']
      }
    },
  },
  ignorePatterns: ['.eslintrc.cjs', '.prettierrc.cjs', 'dist/*'],
  rules: {
    'prettier/prettier': ['warn'],
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'import/no-cycle': ['error'],
    'no-void': ['error', { allowAsStatement: true }],
    'no-console': ['warn'],
    'max-classes-per-file': ['error', 1],
    'class-methods-use-this': 'off',
    'no-param-reassign': 'warn',
    'no-underscore-dangle': 'error',
    '@typescript-eslint/no-inferrable-types': ['off'],
    '@typescript-eslint/typedef': [
      'warn',
      {
        arrayDestructuring: true,
        arrowParameter: true,
        memberVariableDeclaration: true,
        objectDestructuring: true,
        parameter: true,
        propertyDeclaration: true,
        variableDeclaration: true,
        variableDeclarationIgnoreFunction: true
      }
    ],
    '@typescript-eslint/unbound-method': 'error',
    '@typescript-eslint/explicit-member-accessibility': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '_.+' }],
    "@typescript-eslint/no-unnecessary-condition": "error",
    '@typescript-eslint/no-empty-interface': [
      'error',
      {
        allowSingleExtends: true
      }
    ]
  }
}