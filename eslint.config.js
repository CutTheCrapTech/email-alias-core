// @ts-check

import eslint from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default [
  // Global ignores
  {
    ignores: ['dist/', 'node_modules/', 'coverage/', '.DS_Store', 'npm-debug.log*'],
  },

  // Base recommended configurations
  eslint.configs.recommended,

  // TS-specific configs
  {
    files: ['**/*.ts'],
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
    },
  },

  // Global language options
  {
    languageOptions: {
      globals: {
        ...Object.fromEntries(
          Object.entries({ ...globals.browser, ...globals.worker }).map(([key, value]) => [
            key.trim(),
            value,
          ])
        ),
        crypto: 'readonly',
      },
    },
  },

  // Jest-specific configuration
  {
    files: ['**/*.test.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },

  // Prettier config comes last to override other formatting rules
  eslintPluginPrettierRecommended,
];
