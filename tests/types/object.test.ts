import path from 'path';
import { type AssertTypeSelector, fromFile, t } from '@tsz/index';

import type * as ObjectCase from './definitions/object.tsz';

describe('Object', () => {
  let type!: AssertTypeSelector<typeof ObjectCase>;

  beforeAll(() => {
    type = fromFile(path.join(__dirname, 'definitions', 'object.tsz.ts'));
  });

  describe('Anonymous', () => {
    test('Only Indexes', () => {
      type('AnonymousObjectWithOnlyIndex_1').isAnonymousObject({
        indexes: [{ keyType: t.string(), type: t.number() }],
        properties: {},
      });

      type('AnonymousObjectWithOnlyIndex_2').isAnonymousObject({
        indexes: [{ keyType: t.string(), type: t.union([t.number(), t.string()]) }],
        properties: {},
      });

      type('AnonymousObjectWithOnlyIndexes_1').isAnonymousObject({
        indexes: [
          { keyType: t.string(), type: t.number() },
          { keyType: t.symbol(), type: t.string() },
        ],
      });
    });

    test('Only Properties', () => {
      type('AnonymousObjectWithOnlyProperties').isAnonymousObject({
        properties: {
          foo: t.stringLiteral('bar'),
          bar: t.boolean(),
          baz: t.tuple([t.string(), t.number()]),
        },
      });
    });

    test.skip('Indexes and Properties', () => {});
  });

  describe('Mapped', () => {
    test('Basic', () => {
      type('MappedObjectWithSimpleTemplateType').isMappedType({
        properties: ['foo', 'barr', 'baz'],
        templateType: t.boolean(),
      });

      type('MappedObjectWithKeyFilter').isMappedType();
    });

    test.skip('Index Filtering', () => {});
  });
});
