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
  Anonymous,
  Mapped,
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

export type ObjectType = AnonymousObjectType | MappedObjectType;

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
