import path from 'path';
import { type AssertTypeSelector, fromFile, t } from '@tsz/index';

import type * as StringCase from './definitions/string.tsz';

describe('String', () => {
  let type!: AssertTypeSelector<typeof StringCase>;

  beforeAll(() => {
    type = fromFile(path.join(__dirname, 'definitions', 'string.tsz.ts'));
  });

  test('Primitive', () => {
    type('String').isString();
    type('String').is(t.string());

    // Inverse checks
    type('String').not.isStringLiteral();
    type('String').not.isTemplateLiteral();
  });

  test('Literal', () => {
    type('StringLiteral').isStringLiteral();
    type('StringLiteral').isStringLiteral('Hello World!');
    type('StringLiteral').is(t.stringLiteral());
    type('StringLiteral').is(t.stringLiteral('Hello World!'));

    // Inverse checks
    type('StringLiteral').not.isString();
    type('String').not.isTemplateLiteral();
    type('StringLiteral').not.isStringLiteral('foo bar'); // wrong literal value
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

    type('StringTemplate').isTemplateLiteral();
    type('StringTemplate').isTemplateLiteral(template);
    type('StringTemplate').is(t.templateLiteral());
    type('StringTemplate').is(t.templateLiteral(template));

    // Inverse checks
    type('StringTemplate').not.isString();
    type('StringTemplate').not.isStringLiteral();
    type('StringTemplate').not.isTemplateLiteral([]);

    // Wrong text, correct types
    template[0] = 'wrong string';
    type('StringTemplate').not.isTemplateLiteral(template);

    // Correct texts, wrong type
    template[0] = 'Hello ';
    template[1] = t.number();
    type('StringTemplate').not.isTemplateLiteral(template);
  });

  // TODO: Replace checks with .not.isStringLike when available
  test.each(['FalseStringAsArray', 'FalseStringAsNumber', 'FalseStringAsBoolean'])(
    '%s is not a string',
    (typeName) => {
      type(typeName).not.isString();
      type(typeName).not.isStringLiteral();
      type(typeName).not.isTemplateLiteral();
    }
  );
});
