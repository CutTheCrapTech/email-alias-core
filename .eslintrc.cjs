/* eslint-env node */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    // Add any specific project rules here.
    // For example, to enforce a specific style for imports:
    // 'import/order': ['error', { 'newlines-between': 'always' }],
    'prettier/prettier': 'error',
  },
  env: {
    node: true,
    jest: true,
  },
};
