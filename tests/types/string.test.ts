import path from 'path';
import {type AssertTypeSelector, fromFile} from '@tsz/index';

import type * as StringCase from './definitions/string.tsz';

describe('String', () => {
  let assertType!: AssertTypeSelector<typeof StringCase>;

  beforeAll(() => {
    assertType = fromFile(path.join(__dirname, 'definitions', 'string.tsz.ts'));
  });

  test('Primitive', () => {
    assertType('String').isString();
    // Inverse checks
    assertType('String').not.isStringLiteral();
  });

  test('Literal', () => {
    // String Literal checks
    assertType('StringLiteral').isStringLiteral();
    assertType('StringLiteral').isStringLiteral('Hello World!');
    // Inverse checks
    assertType('StringLiteral').not.isString();
    assertType('StringLiteral').not.isStringLiteral('Foo bar')
  })

  // TODO: Add the isStringTemplate matcher
  test('Template', () => {
    // Inverse checks
    assertType('StringTemplate').not.isString();
    assertType('StringTemplate').not.isStringLiteral();
  })

  // TODO: Add .not.isStringTemplate when the matcher is available
  // TODO: Replace checks with .not.isStringLike when available
  test.each(['FalseStringAsArray', 'FalseStringAsNumber', 'FalseStringAsBoolean'])('%s is not a string', (typeName) => {
    assertType(typeName).not.isString();
    assertType(typeName).not.isStringLiteral();
  })
});
