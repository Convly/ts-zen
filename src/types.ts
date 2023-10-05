export const enum TypeKind {
  Any,
  Array,
  BigInt,
  BigIntLiteral,
  Boolean,
  BooleanLiteral,
  Enum,
  EnumLiteral,
  Intersection,
  Mapped,
  Never,
  Null,
  Number,
  NumberLiteral,
  Object,
  String,
  StringLiteral,
  Symbol,
  TemplateLiteral,
  Tuple,
  Undefined,
  Union,
  Unknown,
  Void,
}

export const enum ObjectKind {
  None = 0,
  Class = 1 << 0, // Class
  Interface = 1 << 1, // Interface
  Reference = 1 << 2, // Generic type reference
  Tuple = 1 << 3, // Synthesized generic tuple type
  Anonymous = 1 << 4, // Anonymous
  Mapped = 1 << 5, // Mapped
  Instantiated = 1 << 6, // Instantiated anonymous or mapped type
  ObjectLiteral = 1 << 7, // Originates in an object literal
  EvolvingArray = 1 << 8, // Evolving array type
  ObjectLiteralPatternWithComputedProperties = 1 << 9, // Object literal pattern with computed properties
  ReverseMapped = 1 << 10, // Object contains a property from a reverse-mapped type
  JsxAttributes = 1 << 11, // Jsx attributes type
  JSLiteral = 1 << 12, // Object type declared in JS - disables errors on read/write of nonexisting members
  FreshLiteral = 1 << 13, // Fresh object literal
  ArrayLiteral = 1 << 14, // Originates in an array literal
  /** @internal */
  PrimitiveUnion = 1 << 15, // Union of only primitive types
  /** @internal */
  ContainsWideningType = 1 << 16, // Type is or contains undefined or null widening type
  /** @internal */
  ContainsObjectOrArrayLiteral = 1 << 17, // Type is or contains object literal type
  /** @internal */
  NonInferrableType = 1 << 18, // Type is or contains anyFunctionType or silentNeverType
  /** @internal */
  CouldContainTypeVariablesComputed = 1 << 19, // CouldContainTypeVariables flag has been computed
  /** @internal */
  CouldContainTypeVariables = 1 << 20, // Type could contain a type variable

  ClassOrInterface = Class | Interface,
  /** @internal */
  RequiresWidening = ContainsWideningType | ContainsObjectOrArrayLiteral,
  /** @internal */
  PropagatingFlags = ContainsWideningType | ContainsObjectOrArrayLiteral | NonInferrableType,
  /** @internal */
  InstantiatedMapped = Mapped | Instantiated,
  // Object flags that uniquely identify the kind of ObjectType
  /** @internal */
  ObjectTypeKindMask = ClassOrInterface |
    Reference |
    Tuple |
    Anonymous |
    Mapped |
    ReverseMapped |
    EvolvingArray,

  // Flags that require TypeFlags.Object
  ContainsSpread = 1 << 21, // Object literal contains spread operation
  ObjectRestType = 1 << 22, // Originates in object rest declaration
  InstantiationExpressionType = 1 << 23, // Originates in instantiation expression
  /** @internal */
  IsClassInstanceClone = 1 << 24, // Type is a clone of a class instance type
  // Flags that require TypeFlags.Object and ObjectFlags.Reference
  /** @internal */
  IdenticalBaseTypeCalculated = 1 << 25, // has had `getSingleBaseForNonAugmentingSubtype` invoked on it already
  /** @internal */
  IdenticalBaseTypeExists = 1 << 26, // has a defined cachedEquivalentBaseType member

  // Flags that require TypeFlags.UnionOrIntersection, TypeFlags.Substitution, or TypeFlags.TemplateLiteral
  /** @internal */
  IsGenericTypeComputed = 1 << 21, // IsGenericObjectType flag has been computed
  /** @internal */
  IsGenericObjectType = 1 << 22, // Union or intersection contains generic object type
  /** @internal */
  IsGenericIndexType = 1 << 23, // Union or intersection contains generic index type
  /** @internal */
  IsGenericType = IsGenericObjectType | IsGenericIndexType,

  // Flags that require TypeFlags.Union
  /** @internal */
  ContainsIntersections = 1 << 24, // Union contains intersections
  /** @internal */
  IsUnknownLikeUnionComputed = 1 << 25, // IsUnknownLikeUnion flag has been computed
  /** @internal */
  IsUnknownLikeUnion = 1 << 26, // Union of null, undefined, and empty object type
  /** @internal */

  // Flags that require TypeFlags.Intersection
  /** @internal */
  IsNeverIntersectionComputed = 1 << 24, // IsNeverLike flag has been computed
  /** @internal */
  IsNeverIntersection = 1 << 25, // Intersection reduces to never
}

interface BaseType<T extends TypeKind> {
  kind: T;
  toString(): string;
}

export interface AnyType extends BaseType<TypeKind.Any> {}

export interface ArrayType extends BaseType<TypeKind.Array> {
  type?: Type;
}

export interface BigIntType extends BaseType<TypeKind.BigInt> {}

export interface BigIntLiteralType extends BaseType<TypeKind.BigIntLiteral> {
  value?: bigint;
}

export interface BooleanType extends BaseType<TypeKind.Boolean> {}

export interface BooleanLiteralType extends BaseType<TypeKind.BooleanLiteral> {
  value?: boolean;
}

export interface EnumType extends BaseType<TypeKind.Enum> {}

// TODO
export interface EnumLiteralType extends BaseType<TypeKind.Enum> {
  value?: unknown;
}

export interface IntersectionType extends BaseType<TypeKind.Intersection> {
  types?: Type[];
}

export interface NeverType extends BaseType<TypeKind.Never> {}

export interface NullType extends BaseType<TypeKind.Null> {}

export interface NumberType extends BaseType<TypeKind.Number> {}

export interface NumberLiteralType extends BaseType<TypeKind.NumberLiteral> {
  value?: number;
}

export type ObjectType =
  | AnonymousObjectType
  | MappedObjectType
  // Fallback
  | BaseObjectType<Exclude<ObjectKind, ObjectKind.Anonymous | ObjectKind.Mapped>>;

export interface StringType extends BaseType<TypeKind.String> {}

export interface StringLiteralType extends BaseType<TypeKind.StringLiteral> {
  value?: string;
}

export interface SymbolType extends BaseType<TypeKind.Symbol> {
  unique?: boolean;
}

export interface TemplateLiteralType extends BaseType<TypeKind.TemplateLiteral> {
  template?: (string | Type)[];
}

export interface TupleType extends BaseType<TypeKind.Tuple> {
  types?: Type[];
}

export interface UndefinedType extends BaseType<TypeKind.Undefined> {}

export interface UnionType extends BaseType<TypeKind.Union> {
  types?: Type[];
}

export interface UnknownType extends BaseType<TypeKind.Unknown> {}

export interface VoidType extends BaseType<TypeKind.Void> {}

export interface BaseObjectType<T extends ObjectKind = ObjectKind.Anonymous>
  extends BaseType<TypeKind.Object> {
  objectKind: T;
}

export interface AnonymousObjectType extends BaseObjectType<ObjectKind.Anonymous> {
  indexes?: Array<{ keyType: Type; type: Type }>;
  properties?: Record<string, Type>;
}

export interface MappedObjectType extends BaseObjectType<ObjectKind.Mapped> {
  properties?: string[];
  templateType?: Type;
}

export type Type =
  | AnyType
  | ArrayType
  | UnknownType
  | StringType
  | NumberType
  | BooleanType
  | EnumType
  | BigIntType
  | StringLiteralType
  | NumberLiteralType
  | BooleanLiteralType
  | EnumLiteralType
  | BigIntLiteralType
  | SymbolType
  | VoidType
  | UndefinedType
  | NullType
  | NeverType
  | ObjectType
  | UnionType
  | IntersectionType
  | TupleType
  | TemplateLiteralType;

// Factories
export default {
  array: (type?: Type): ArrayType => ({
    kind: TypeKind.Array,
    type,
    toString() {
      return type ? `Array<${type.toString()}>` : 'Array';
    },
  }),

  bigInt: (): BigIntType => ({
    kind: TypeKind.BigInt,
    toString() {
      return 'bigint';
    },
  }),

  bigIntLiteral: (value?: bigint): BigIntLiteralType => ({
    kind: TypeKind.BigIntLiteral,
    value,
    toString() {
      return value ? String(value) : 'BigIntLiteral';
    },
  }),

  boolean: (): BooleanType => ({
    kind: TypeKind.Boolean,
    toString() {
      return 'boolean';
    },
  }),

  booleanLiteral: (value?: boolean): BooleanLiteralType => ({
    kind: TypeKind.BooleanLiteral,
    value,
    toString() {
      return value ? String(value) : 'BooleanLiteral';
    },
  }),

  intersection: (types?: Type[]): IntersectionType => ({
    kind: TypeKind.Intersection,
    types,
    toString() {
      return types ? types.map((type) => type.toString()).join(' & ') : 'intersection';
    },
  }),

  mappedType: (
    options?: Pick<MappedObjectType, 'properties' | 'templateType'>
  ): MappedObjectType => ({
    kind: TypeKind.Object,
    objectKind: ObjectKind.Mapped,
    ...options,
    toString() {
      if (!options?.properties || !options?.templateType) {
        return 'MappedType';
      }

      const index = `[x in ${options.properties.join(' | ')}]`;
      const templateType = options.templateType?.toString();

      return `{ ${index}: ${templateType}; }`;
    },
  }),

  never: (): NeverType => ({
    kind: TypeKind.Never,
    toString() {
      return 'never';
    },
  }),

  null: (): NullType => ({
    kind: TypeKind.Null,
    toString() {
      return 'null';
    },
  }),

  number: (): NumberType => ({
    kind: TypeKind.Number,
    toString() {
      return 'number';
    },
  }),

  numberLiteral: (value?: number): NumberLiteralType => ({
    kind: TypeKind.NumberLiteral,
    value,
    toString() {
      return value ? String(value) : 'NumberLiteral';
    },
  }),

  anonymousObject: (
    options?: Pick<AnonymousObjectType, 'indexes' | 'properties'>
  ): AnonymousObjectType => ({
    kind: TypeKind.Object,
    objectKind: ObjectKind.Anonymous,
    indexes: options?.indexes,
    properties: options?.properties,
    toString() {
      const indexesAsString = Object.entries(options?.indexes ?? [])
        .map(([key, { keyType, type }]) => `[${key}: ${keyType.toString()}]: ${type.toString()};`)
        .join(' ');

      const propertiesAsString = Object.entries(options?.properties ?? [])
        .map(([key, type]) => `"${key}": ${type};`)
        .join(' ');

      const objectMembersAsString = [propertiesAsString, indexesAsString]
        .filter((s) => s) // only keep non-empty strings
        .join(' ');

      return objectMembersAsString ? `{ ${objectMembersAsString} }` : 'object';
    },
  }),

  object: (object?: ObjectType): ObjectType => {
    const defaultObject = {
      kind: TypeKind.Object,
      objectKind: ObjectKind.Anonymous,
      toString() {
        return 'object';
      },
    } satisfies AnonymousObjectType;

    return object ?? defaultObject;
  },

  string: (): StringType => ({
    kind: TypeKind.String,
    toString() {
      return 'string';
    },
  }),

  stringLiteral: (value?: string): StringLiteralType => ({
    kind: TypeKind.StringLiteral,
    value,
    toString() {
      return value ? `"${value}"` : 'StringLiteral';
    },
  }),

  symbol: (unique: boolean = false): SymbolType => ({
    kind: TypeKind.Symbol,
    unique,
    toString() {
      return unique ? 'UniqueESSymbol' : 'ESSymbol';
    },
  }),

  templateLiteral: (template?: (string | Type)[]): TemplateLiteralType => ({
    kind: TypeKind.TemplateLiteral,
    template,
    toString() {
      const templateAsString = template?.reduce(
        (str, item) => (typeof item === 'string' ? str + item : str + `\${${item.toString()}}`),
        ''
      );

      return templateAsString ? `"${templateAsString}"` : 'TemplateLiteral';
    },
  }),

  tuple: (types?: Type[]): TupleType => ({
    kind: TypeKind.Tuple,
    types,
    toString() {
      return `[${(types ?? []).map((type) => type.toString()).join(', ')}]`;
    },
  }),

  undefined: (): UndefinedType => ({
    kind: TypeKind.Undefined,
    toString() {
      return 'undefined';
    },
  }),

  union: (types?: Type[]): UnionType => ({
    kind: TypeKind.Union,
    types,
    toString() {
      return types ? types.map((type) => type.toString()).join(' | ') : 'union';
    },
  }),

  unknown: (): UnknownType => ({
    kind: TypeKind.Unknown,
    toString() {
      return 'unknown';
    },
  }),

  void: (): VoidType => ({
    kind: TypeKind.Void,
    toString() {
      return 'void';
    },
  }),
};
