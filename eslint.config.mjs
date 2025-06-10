import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

const eslintConfig = [
  {
    languageOptions: {
      parser: parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
  {
    plugins: {
      '@typescript-eslint': tseslint,
    },
  },
  ...compat.extends('next/core-web-vitals', 'eslint:recommended', 'google'),
  {
    rules: {
      'valid-jsdoc': 0,
      'linebreak-style': 0,
      'object-curly-spacing': [ 'error', 'always' ],
      'array-bracket-spacing': [ 'error', 'always' ],
      'max-len': [ 'error', { 'code': 1000 } ],
      'spaced-comment': 0,
      'no-multi-spaces': 0,
      'require-jsdoc': 0,
      'new-cap': 0,
      'no-multiple-empty-lines': 0,
      'no-unsafe-finally': 'off',
      'no-console': 0,
      'no-mixed-spaces-and-tabs': 0,
    },
  },
  {
    languageOptions: {
      globals: {
        amd: true,
      },
    },
  },
];

export default eslintConfig;
