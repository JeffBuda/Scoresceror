import { describe, it, expect } from 'vitest';
import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import globals from 'globals';

/**
 * Architecture unit tests — assert that the view-purity ESLint rules
 * actually fire on the violations they are designed to catch.
 *
 * Each test lints a focused BadView snippet (mirroring the fixture in
 * __fixtures__/BadView.tsx) with the same rules configured in
 * eslint.config.js and asserts the expected error count.
 */

const linter = new Linter();

// Replicates the pure-view block from eslint.config.js
const viewConfig = {
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
    },
    globals: {
      ...globals.browser,
    },
  },
  rules: {
    // No store creation in views — createStore belongs to hooks.
    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.name='createStore']",
        message: 'View files must not create stores; move state into a hook (e.g. useGameState).',
      },
    ],
    // No direct browser side-effects in views.
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
    // File-size ceiling for components (code lines only).
    'max-lines': ['error', { max: 150, skipBlankLines: true, skipComments: true }],
  },
};

/** Lint `code` with the view-purity config. */
const lint = (code: string) => linter.verify(code, [viewConfig]);

describe('SolidJS view architectural rules (enforced via ESLint)', () => {
  describe('BadView.tsx', () => {
    it('store creation in a view -> 1 error', () => {
      const code = `
import { createStore } from 'solid-js';

const BadView = () => {
  const store = createStore({ count: 0 });
  return null;
};
`;
      const errors = lint(code).filter((m) => m.ruleId === 'no-restricted-syntax');
      expect(errors).toHaveLength(1);
    });

    it('localStorage in a view -> 1 error', () => {
      const code = `
const BadView = () => {
  localStorage.setItem('bad', 'data');
  return null;
};
`;
      const errors = lint(code).filter((m) => m.ruleId === 'no-restricted-globals');
      expect(errors).toHaveLength(1);
    });

    it('Date in a view -> 1 error', () => {
      const code = `
const BadView = () => {
  const now = new Date();
  return now.toString();
};
`;
      const errors = lint(code).filter((m) => m.ruleId === 'no-restricted-globals');
      expect(errors).toHaveLength(1);
    });

    it('setTimeout in a view -> 1 error', () => {
      const code = `
const BadView = () => {
  setTimeout(() => console.log('tick'), 1000);
  return null;
};
`;
      const errors = lint(code).filter((m) => m.ruleId === 'no-restricted-globals');
      expect(errors).toHaveLength(1);
    });

    it('oversized component -> 1 error', () => {
      // 155 code lines — exceeds the 150-line ceiling for views.
      const padding = Array.from({ length: 155 }, (_, i) => `const val${i} = ${i};`).join('\n');
      const code = `${padding}\n`;
      const errors = lint(code).filter((m) => m.ruleId === 'max-lines');
      expect(errors).toHaveLength(1);
    });
  });

  describe('GoodView (clean component)', () => {
    it('a properly structured view -> 0 architectural errors', () => {
      const code = `
import { createMemo } from 'solid-js';

const GoodView = () => {
  const time = createMemo(() => 0);
  return <p>{time()}</p>;
};
`;
      const errors = lint(code).filter(
        (m) =>
          m.ruleId === 'no-restricted-syntax' ||
          m.ruleId === 'no-restricted-globals' ||
          m.ruleId === 'max-lines',
      );
      expect(errors).toHaveLength(0);
    });
  });
});
