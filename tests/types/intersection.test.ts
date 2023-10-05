import path from 'path';
import { type AssertTypeSelector, fromFile, t } from '@tsz/index';

import type * as IntersectionCase from './definitions/intersection.tsz';

describe('Intersection', () => {
  let type!: AssertTypeSelector<typeof IntersectionCase>;

  beforeAll(() => {
    type = fromFile(path.join(__dirname, 'definitions', 'intersection.tsz.ts'));
  });

  const objectA = t.anonymousObject({
    properties: { foo: t.stringLiteral('bar'), bar: t.numberLiteral(1) },
  });
  const objectB = t.anonymousObject({
    properties: { foo: t.stringLiteral('baz'), baz: t.booleanLiteral(true) },
  });
  const objectC = t.anonymousObject({ properties: { property: t.stringLiteral('value') } });
  const objectD = t.anonymousObject({ properties: { property: t.numberLiteral(1) } });

  describe('Valid intersections', () => {
    test('Objects intersection', () => {
      type('ValidObjectIntersection').isIntersection();
      type('ValidObjectIntersection').is(t.intersection());

      type('ValidObjectIntersection').isIntersection([objectA, objectB]);
      type('ValidObjectIntersection').is(t.intersection([objectA, objectB]));
    });

    test('Number intersection', () => {
      type('ValidNumberIntersection').isNumberLiteral();
      type('ValidNumberIntersection').is(t.numberLiteral());

      type('ValidNumberIntersection').isNumberLiteral(1);
      type('ValidNumberIntersection').is(t.numberLiteral(1));
    });

    test('String intersection', () => {
      type('ValidStringIntersection').isStringLiteral();
      type('ValidStringIntersection').is(t.stringLiteral());

      type('ValidStringIntersection').isStringLiteral('foo');
      type('ValidStringIntersection').is(t.stringLiteral('foo'));
    });
  });

  describe('Invalid intersections', () => {
    test('Invalid scalar intersection', () => {
      type('InvalidScalarIntersection').isNever();
    });

    test('Invalid number intersection', () => {
      type('InvalidNumberIntersection').isNever();
    });

    test('Invalid string intersection', () => {
      type('InvalidStringIntersection').isNever();
    });

    test('Invalid intersection of objects with incompatible property', () => {
      type('InvalidIntersectionWithMismatchingObjects').isIntersection();
      type('InvalidIntersectionWithMismatchingObjects').is(t.intersection());

      type('InvalidIntersectionWithMismatchingObjects').isIntersection([objectC, objectD]);
      type('InvalidIntersectionWithMismatchingObjects').is(t.intersection([objectC, objectD]));

      // Intersection is distributed at the property level & is computed to never
      type('PropOfIntersectionWithInvalidObjects').isNever();
    });
  });

  describe('Distributed intersections', () => {
    test('Distributed intersection with partial matches', () => {
      type('DistributedIntersectionWithPartialMatches').isNumberLiteral(1);
    });

    test('Distributed intersection with matching objects', () => {
      type('DistributedIntersectionWithMatchingObjects').isUnion([
        t.intersection([objectC, objectA]),
        t.intersection([objectC, objectB]),
      ]);
    });
  });
});
