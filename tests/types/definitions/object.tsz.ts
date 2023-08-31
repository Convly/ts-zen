// Anonymous Objects
type AnonymousObjectWithOnlyIndex_1 = { [x: string]: number };
type AnonymousObjectWithOnlyIndex_2 = { [x: string]: number | string };
// What about when indexes have the same name? Is it converted to union?
type AnonymousObjectWithOnlyIndexes_1 = { [x: string]: number; [y: symbol]: string };
type AnonymousObjectWithOnlyProperties = { foo: 'bar'; bar: boolean; baz: [string, number] };
type AnonymousObjectWithIndexesAndProperties = { [x: string]: string; foo: 'bar'; bar: 'foo' };

// Mapped Objects
type MappedObjectWithSimpleTemplateType = { [key in 'foo' | 'bar' | 'baz']: number };
type MappedObjectWithUnionTemplateType = { [key in 'foo' | 'bar' | 'baz']: string | number };
type MappedObjectWithKeyFilter = {
  [key in 'foo' | 'bar' | 'baz' as key extends `${string}a${string}` ? key : never]:
    | string
    | number;
};

export {
  // Anonymous Object
  AnonymousObjectWithOnlyProperties,
  AnonymousObjectWithOnlyIndex_1,
  AnonymousObjectWithOnlyIndex_2,
  AnonymousObjectWithOnlyIndexes_1,
  AnonymousObjectWithIndexesAndProperties,
  // Mapped Object
  MappedObjectWithKeyFilter,
  MappedObjectWithSimpleTemplateType,
  MappedObjectWithUnionTemplateType,
};
