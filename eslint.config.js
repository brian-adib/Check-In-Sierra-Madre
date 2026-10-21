import js from '@eslint/js';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node, // Variables para el Backend
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
  {
    files: ['public/**/*.js'], // Aplicar solo a la carpeta public
    languageOptions: {
      globals: {
        ...globals.browser, // Permitir document, fetch, window, etc.
      },
    },
  },
  eslintConfigPrettier,
];