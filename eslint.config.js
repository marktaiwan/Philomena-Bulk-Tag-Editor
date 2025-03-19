import globals from 'globals';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    name: 'language-options',
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.greasemonkey,
      },
    },
    plugins: {
      '@stylistic': stylistic,
    }
  },
  {
    name: 'eslint/recommended',
    ...eslint.configs.recommended,
  },
  {
    name: 'my-rules',
    rules: {
      'block-scoped-var': 'error',
      'no-debugger': 'warn',
      'no-console': 'off',
      'no-irregular-whitespace': 'error',
      'no-label-var': 'warn',
      'no-redeclare': ['error', {builtinGlobals: true}],
      'no-self-compare': 'error',
      'no-sparse-arrays': 'warn',
      'no-undef': 'warn',
      'no-unreachable': 'error',
      'no-unused-expressions': 'warn',
      'no-unused-vars': 'warn',
      'prefer-const': 'warn',
      'prefer-spread': 'warn',
      'valid-typeof': 'warn',
    },
  },
  {
    name: 'my-stylistic-rules',
    rules: {
      '@stylistic/arrow-spacing': ['warn', {
        'before': true,
        'after': true,
      }],
      '@stylistic/comma-dangle': ['warn', {
        'arrays': 'always-multiline',
        'objects': 'only-multiline',
        'imports': 'always-multiline',
        'exports': 'always-multiline',
        'functions': 'only-multiline',
        'importAttributes': 'always-multiline',
        'dynamicImports': 'always-multiline',
      }],
      '@stylistic/comma-spacing': 'error',
      '@stylistic/dot-location': [
        'error',
        'property',
      ],
      '@stylistic/eol-last': 'error',
      '@stylistic/indent': ['error', 2, {
        'SwitchCase': 1,
        'VariableDeclarator': 'first',
        'ignoreComments': true,
        'MemberExpression': 'off',
        'outerIIFEBody': 'off',
        'flatTernaryExpressions': true,
      }],
      '@stylistic/key-spacing': ['error', {
        'afterColon': true,
        'mode': 'minimum',
      }],
      '@stylistic/keyword-spacing': ['error', {'before': true, 'after': true}],
      '@stylistic/lines-around-comment': ['warn', {
        'beforeBlockComment': false,
        'beforeLineComment': false,
        'allowBlockStart': true,
      }],
      '@stylistic/member-delimiter-style': ['warn', {
        'multiline': {
          'delimiter': 'semi',
          'requireLast': true,
        },
        'singleline': {
          'delimiter': 'semi',
          'requireLast': false,
        },
        'multilineDetection': 'brackets',
      }],
      '@stylistic/no-extra-semi': 'error',
      '@stylistic/no-mixed-spaces-and-tabs': 'error',
      '@stylistic/no-multi-spaces': ['warn', {ignoreEOLComments: true}],
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/object-curly-spacing': ['warn', 'never'],
      '@stylistic/quotes': ['error', 'single', {avoidEscape: true}],
      '@stylistic/semi': ['warn', 'always'],
      '@stylistic/semi-spacing': ['warn', {after: true}],
      '@stylistic/space-before-function-paren': ['error', {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always',
      }],
      '@stylistic/space-infix-ops': 'warn',
      '@stylistic/spaced-comment': ['warn', 'always'],
      '@stylistic/wrap-iife': ['warn', 'inside'],
      '@stylistic/wrap-regex': 'warn',
    },
  },
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,
  {
    name: 'my-rules-ts',
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    rules: {
      '@typescript-eslint/array-type': ['error', {
        'default': 'array-simple'
      }],
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/consistent-indexed-object-style': 'off',
      '@typescript-eslint/no-explicit-any': ['error', {'ignoreRestArgs': true}],
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-inferrable-types': ['warn', {
        'ignoreParameters': true,
        'ignoreProperties': true,
      }],
      '@typescript-eslint/prefer-for-of': 'off',
    }
  },
];
