import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import solid from 'eslint-plugin-solid';

/**
 * View files (components/route UI) must stay pure:
 *   - no store creation (createStore belongs to hooks — e.g. useGameState)
 *   - no direct browser side-effects (localStorage, IndexedDB, timers, Date)
 * Orchestration lives in `src/hooks/**`.
 */
const viewFiles = ['src/**/*.tsx'];

/** `max-lines` ceiling that measures code only (skip comments & blank lines). */
const ceiling = (max) => ({
  'max-lines': ['error', { max, skipBlankLines: true, skipComments: true }],
});

export default tseslint.config(
  {
    // Never lint build output, assets, or repo/cfg files.
    ignores: [
      'dist',
      'dev-dist',
      'node_modules',
      'public',
      'src/assets',
      'src/**/*.css',
      '**/*.svg',
      '**/*.png',
      '**/*.woff2',
      '**/tsconfig*.json',
      '**/*.json',
      '**/*.md',
      '*.config.*',
      'scripts/**',
      'src/arch/__fixtures__/**',
    ],
  },

  // --- TS parser + JS/TS recommended (applies to every .ts/.tsx) -------------
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-empty-pattern': 'off',
    },
  },

  // --- SolidJS 2.0 best practices (eslint-plugin-solid) ----------------------
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { solid },
    settings: { solid: { version: 2 } },
    rules: {
      'solid/no-single-arg-create-effect': 'error',
      'solid/no-store-mutation-outside-setter': 'error',
      'solid/no-write-in-pure-computation': 'error',
      'solid/no-accessor-as-prop': 'warn',
      'solid/event-handlers': 'warn',
      'solid/no-boolean-enumerated-attribute': 'warn',
      'solid/prefer-structured-class': 'warn',
      'solid/reactivity': 'warn',
      'solid/no-react-specific-props': 'off',
    },
  },

  // --- File-size ceilings (skip comments & blanks; measure code brevity) ----
  { files: viewFiles, rules: ceiling(150) },
  { files: ['src/hooks/**/*.ts'], rules: ceiling(200) },
  { files: ['src/utils/**/*.ts', 'src/*.ts'], rules: ceiling(80) },

  // --- Tests: exempt from file-size and unused-var strictness ----------------
  // (test scaffolding legitimately receives mock-only params)
  {
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      'max-lines': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // --- Pure-view enforcement (components/views only) ------------------------
  {
    files: viewFiles,
    rules: {
      // No store creation in views; createStore is a hook concern.
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='createStore']",
          message: 'View files must not create stores; move state into a hook (e.g. useGameState).',
        },
      ],
      // No direct browser side-effects; route through hooks/utilities.
      'no-restricted-globals': [
        'error',
        {
          name: 'localStorage',
          message: 'Views must not touch storage directly; use a hook or utility.',
        },
        {
          name: 'sessionStorage',
          message: 'Views must not touch storage directly; use a hook or utility.',
        },
        {
          name: 'indexedDB',
          message: 'Use the IndexedDB utility, not indexedDB directly.',
        },
        {
          name: 'setTimeout',
          message: 'Timers must live in hooks, not views.',
        },
        {
          name: 'setInterval',
          message: 'Intervals must live in hooks, not views.',
        },
        {
          name: 'Date',
          message: 'Time reads must live in hooks, not views.',
        },
      ],
    },
  },
);
