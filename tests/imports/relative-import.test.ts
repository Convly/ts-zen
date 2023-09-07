import path from 'path';
import { type AssertTypeSelector, fromFile, fromRaw } from '@tsz/index';

const raw = `
import type { NoOp } from './resource/custom-lib';

type NoOpNumber = NoOp<number>;

export { NoOpNumber };
`;

describe('Relative Import', () => {
  let type!: AssertTypeSelector;

  describe('Raw', () => {
    test('Successfully resolve the relative import from raw code', () => {
      type = fromRaw(raw, { baseUrl: __dirname });

      type('NoOpNumber').not.equals('NoOp<number>');
      type('NoOpNumber').isNumber();
    });
  });

  describe('File', () => {
    test('Successfully resolve the relative import from a file', () => {
      type = fromFile(path.join(__dirname, 'definitions', 'lib.ts'));

      type('NoOpString').not.equals('NoOp<string>');
      type('NoOpString').isString();
    });

    test('Custom base URL', () => {
      type = fromFile(path.join(__dirname, 'definitions', 'lib-custom-base.ts'), {
        baseUrl: __dirname,
      });

      type('NoOpBoolean').not.equals('NoOp<boolean>');
      type('NoOpBoolean').isBoolean();
    });
  });
});
