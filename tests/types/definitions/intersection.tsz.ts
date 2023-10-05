type ObjectA = { foo: 'bar'; bar: 1 };
type ObjectB = { foo: 'baz'; baz: true };
type ObjectC = { property: 'value' };
type ObjectD = { property: 1 };

/**
 * Basic intersections
 */

type ValidObjectIntersection = ObjectA & ObjectB;
type ValidNumberIntersection = number & 1;
type ValidStringIntersection = string & 'foo';

/**
 * Invalid intersections
 */

type InvalidScalarIntersection = string & number;
type InvalidNumberIntersection = 1 & 2;
type InvalidStringIntersection = 'foo' & 'bar';
type InvalidIntersectionWithMismatchingObjects = ObjectC & ObjectD;
type PropOfIntersectionWithInvalidObjects = InvalidIntersectionWithMismatchingObjects['property'];

/**
 * Distributed intersections
 */

// -> number & ('a' | 1 | false)
// -> (number & 'a') | (number & 1) | (number & false)
// -> never | 1 | never
// -> 1
type DistributedIntersectionWithPartialMatches = number & ('a' | 1 | false);

// -> ObjectC & (ObjectA | ObjectB)
// -> (ObjectC & ObjectA) | (ObjectC & ObjectB)
type DistributedIntersectionWithMatchingObjects = ObjectC & (ObjectA | ObjectB);

export {
  // Valid
  ValidObjectIntersection,
  ValidNumberIntersection,
  ValidStringIntersection,
  // Invalid
  InvalidScalarIntersection,
  InvalidNumberIntersection,
  InvalidStringIntersection,
  InvalidIntersectionWithMismatchingObjects,
  PropOfIntersectionWithInvalidObjects,
  // Distribution
  DistributedIntersectionWithPartialMatches,
  DistributedIntersectionWithMatchingObjects,
};
