import path from 'path';
import { type AssertTypeSelector, fromFile, t } from '@tsz/index';

import type * as StringCase from './definitions/string.tsz';

describe('String', () => {
  let assertType!: AssertTypeSelector<typeof StringCase>;

  beforeAll(() => {
    assertType = fromFile(path.join(__dirname, 'definitions', 'string.tsz.ts'));
  });

  test('Primitive', () => {
    assertType('String').isString();
    assertType('String').is(t.string());

    // Inverse checks
    assertType('String').not.isStringLiteral();
    assertType('String').not.isTemplateLiteral();
  });

  test('Literal', () => {
    assertType('StringLiteral').isStringLiteral();
    assertType('StringLiteral').isStringLiteral('Hello World!');
    assertType('StringLiteral').is(t.stringLiteral());
    assertType('StringLiteral').is(t.stringLiteral('Hello World!'));

    // Inverse checks
    assertType('StringLiteral').not.isString();
    assertType('String').not.isTemplateLiteral();
    assertType('StringLiteral').not.isStringLiteral('foo bar'); // wrong literal value
  });

  test('Template', () => {
    const template = [
      'Hello ',
      t.string(),
      // literal values such as ${true} are diluted in string literals and are not present as ts.Types
      '. Open? true, from ',
      t.number(),
      ' to ',
      t.number(),
    ];

    assertType('StringTemplate').isTemplateLiteral();
    assertType('StringTemplate').isTemplateLiteral(template);
    assertType('StringTemplate').is(t.templateLiteral());
    assertType('StringTemplate').is(t.templateLiteral(template));

    // Inverse checks
    assertType('StringTemplate').not.isString();
    assertType('StringTemplate').not.isStringLiteral();
    assertType('StringTemplate').not.isTemplateLiteral([]);

    // Wrong text, correct types
    template[0] = 'wrong string';
    assertType('StringTemplate').not.isTemplateLiteral(template);

    // Correct texts, wrong type
    template[0] = 'Hello ';
    template[1] = t.number();
    assertType('StringTemplate').not.isTemplateLiteral(template);
  });

  // TODO: Replace checks with .not.isStringLike when available
  test.each(['FalseStringAsArray', 'FalseStringAsNumber', 'FalseStringAsBoolean'])(
    '%s is not a string',
    (typeName) => {
      assertType(typeName).not.isString();
      assertType(typeName).not.isStringLiteral();
      assertType(typeName).not.isTemplateLiteral();
    }
  );
});
