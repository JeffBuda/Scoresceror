/**
 * BadView.tsx — Fixture: a SolidJS view component that violates every
 * architectural rule enforced by eslint.config.js.
 *
 * This file is excluded from `npm run lint` (see eslint.config.js ignores)
 * because it is intentionally bad. The arch tests in solidjs-rules.arch.test.ts
 * lint this file programmatically to assert each rule fires exactly once.
 */
import type { JSX } from '@solidjs/web';
import { createStore } from 'solid-js';

const BadView = (): JSX.Element => {
  // Violation: createStore in a view (no-restricted-syntax)
  const store = createStore({ count: 0 });

  // Violation: localStorage in a view (no-restricted-globals)
  localStorage.setItem('bad', 'data');

  // Violation: setTimeout in a view (no-restricted-globals)
  setTimeout(() => console.log('tick'), 1000);

  // Violation: Date in a view (no-restricted-globals)
  const now = new Date();

  // --- Padding to exceed the 150-line code ceiling (max-lines) ---
  // Each line below is actual code (no blanks / comments) so that
  // `max-lines` with { skipBlankLines, skipComments } fires exactly once.
  const r0 = 0;
  const r1 = 1;
  const r2 = 2;
  const r3 = 3;
  const r4 = 4;
  const r5 = 5;
  const r6 = 6;
  const r7 = 7;
  const r8 = 8;
  const r9 = 9;
  const r10 = 10;
  const r11 = 11;
  const r12 = 12;
  const r13 = 13;
  const r14 = 14;
  const r15 = 15;
  const r16 = 16;
  const r17 = 17;
  const r18 = 18;
  const r19 = 19;
  const r20 = 20;
  const r21 = 21;
  const r22 = 22;
  const r23 = 23;
  const r24 = 24;
  const r25 = 25;
  const r26 = 26;
  const r27 = 27;
  const r28 = 28;
  const r29 = 29;
  const r30 = 30;
  const r31 = 31;
  const r32 = 32;
  const r33 = 33;
  const r34 = 34;
  const r35 = 35;
  const r36 = 36;
  const r37 = 37;
  const r38 = 38;
  const r39 = 39;
  const r40 = 40;
  const r41 = 41;
  const r42 = 42;
  const r43 = 43;
  const r44 = 44;
  const r45 = 45;
  const r46 = 46;
  const r47 = 47;
  const r48 = 48;
  const r49 = 49;
  const r50 = 50;
  const r51 = 51;
  const r52 = 52;
  const r53 = 53;
  const r54 = 54;
  const r55 = 55;
  const r56 = 56;
  const r57 = 57;
  const r58 = 58;
  const r59 = 59;
  const r60 = 60;
  const r61 = 61;
  const r62 = 62;
  const r63 = 63;
  const r64 = 64;
  const r65 = 65;
  const r66 = 66;
  const r67 = 67;
  const r68 = 68;
  const r69 = 69;
  const r70 = 70;
  const r71 = 71;
  const r72 = 72;
  const r73 = 73;
  const r74 = 74;
  const r75 = 75;
  const r76 = 76;
  const r77 = 77;
  const r78 = 78;
  const r79 = 79;
  const r80 = 80;
  const r81 = 81;
  const r82 = 82;
  const r83 = 83;
  const r84 = 84;
  const r85 = 85;
  const r86 = 86;
  const r87 = 87;
  const r88 = 88;
  const r89 = 89;
  const r90 = 90;
  const r91 = 91;
  const r92 = 92;
  const r93 = 93;
  const r94 = 94;
  const r95 = 95;
  const r96 = 96;
  const r97 = 97;
  const r98 = 98;
  const r99 = 99;
  const r100 = 100;
  const r101 = 101;
  const r102 = 102;
  const r103 = 103;
  const r104 = 104;
  const r105 = 105;
  const r106 = 106;
  const r107 = 107;
  const r108 = 108;
  const r109 = 109;
  const r110 = 110;
  const r111 = 111;
  const r112 = 112;
  const r113 = 113;
  const r114 = 114;
  const r115 = 115;
  const r116 = 116;
  const r117 = 117;
  const r118 = 118;
  const r119 = 119;
  const r120 = 120;
  const r121 = 121;
  const r122 = 122;
  const r123 = 123;
  const r124 = 124;
  const r125 = 125;
  const r126 = 126;
  const r127 = 127;
  const r128 = 128;
  const r129 = 129;
  const r130 = 130;
  const r131 = 131;
  const r132 = 132;
  const r133 = 133;
  const r134 = 134;
  const r135 = 135;
  const r136 = 136;
  const r137 = 137;
  const r138 = 138;
  const r139 = 139;
  const r140 = 140;
  const r141 = 141;
  const r142 = 142;
  const r143 = 143;
  const r144 = 144;
  const r145 = 145;
  const r146 = 146;
  const r147 = 147;
  const r148 = 148;
  const r149 = 149;

  return (
    <div>
      <p>{store.count}</p>
      <p>{now.toString()}</p>
    </div>
  );
};

export default BadView;
