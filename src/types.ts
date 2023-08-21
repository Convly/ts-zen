import ts from 'typescript';

export interface BaseType<TFlags extends ts.TypeFlags = ts.TypeFlags> {
  flags: TFlags;
  toString(): string;
}

abstract class AbstractType<T extends ts.TypeFlags> implements BaseType<T> {
  protected constructor(public readonly flags: T) {}

  toString() {
    return ts.TypeFlags[this.flags];
  }
}

abstract class AbstractLiteralType<
  TValue,
  TFlags extends ts.TypeFlags = ts.TypeFlags,
> extends AbstractType<TFlags> {
  value?: TValue;

  protected constructor(flags: TFlags, value?: TValue) {
    super(flags);

    this.value = value;
  }

  toString() {
    return this.value ? `${super.toString()}<${this.value.toString()}>` : super.toString();
  }
}

export class AnyType extends AbstractType<ts.TypeFlags.Any> {
  constructor() {
    super(ts.TypeFlags.Any);
  }
}

export class UnknownType extends AbstractType<ts.TypeFlags.Unknown> {
  constructor() {
    super(ts.TypeFlags.Unknown);
  }
}

export class StringType extends AbstractType<ts.TypeFlags.String> {
  constructor() {
    super(ts.TypeFlags.String);
  }
}

export class NumberType extends AbstractType<ts.TypeFlags.Number> {
  constructor() {
    super(ts.TypeFlags.Number);
  }
}

export class BooleanType extends AbstractType<ts.TypeFlags.Boolean> {
  constructor() {
    super(ts.TypeFlags.Boolean);
  }
}

export class EnumType extends AbstractType<ts.TypeFlags.Enum> {
  constructor() {
    super(ts.TypeFlags.Enum);
  }
}

// TODO: Fix (doesn't match `bigint` as it should)
export class BigIntType extends AbstractType<ts.TypeFlags.BigInt> {
  constructor() {
    super(ts.TypeFlags.BigInt);
  }
}

export class StringLiteralType extends AbstractLiteralType<string, ts.TypeFlags.StringLiteral> {
  constructor(value?: string) {
    super(ts.TypeFlags.StringLiteral, value);
  }
}

export class NumberLiteralType extends AbstractLiteralType<number, ts.TypeFlags.NumberLiteral> {
  constructor(value?: number) {
    super(ts.TypeFlags.NumberLiteral, value);
  }
}

export class BooleanLiteralType extends AbstractLiteralType<boolean, ts.TypeFlags.BooleanLiteral> {
  constructor(value?: boolean) {
    super(ts.TypeFlags.BooleanLiteral, value);
  }
}

export class EnumLiteralType extends AbstractLiteralType<BaseType, ts.TypeFlags.EnumLiteral> {
  constructor(value?: BaseType) {
    super(ts.TypeFlags.EnumLiteral, value);
  }
}

export class BigIntLiteralType extends AbstractLiteralType<bigint, ts.TypeFlags.BigIntLiteral> {
  constructor(value?: bigint) {
    super(ts.TypeFlags.BigIntLiteral, value);
  }
}

export class VoidType extends AbstractType<ts.TypeFlags.Void> {
  constructor() {
    super(ts.TypeFlags.Void);
  }
}

export class UndefinedType extends AbstractType<ts.TypeFlags.Undefined> {
  constructor() {
    super(ts.TypeFlags.Undefined);
  }
}

export class NullType extends AbstractType<ts.TypeFlags.Null> {
  constructor() {
    super(ts.TypeFlags.Null);
  }
}

export class NeverType extends AbstractType<ts.TypeFlags.Never> {
  constructor() {
    super(ts.TypeFlags.Never);
  }
}

export class ObjectType extends AbstractType<ts.TypeFlags.Object> {
  objectFlags?: ts.ObjectFlags;
  properties?: Record<string, Type>;

  constructor(properties?: Record<string, Type>, objectFlags?: ts.ObjectFlags) {
    super(ts.TypeFlags.Object);

    this.properties = properties;
    this.objectFlags = objectFlags;
  }

  toString() {
    if (this.properties === undefined) {
      return super.toString();
    }

    const propertiesAsString: string = JSON.stringify(
      Object.entries(this.properties).reduce(
        (acc, [key, type]) => ({ ...acc, [key]: type.toString() }),
        {}
      ),
      null,
      2
    );

    return `${super.toString()}<${propertiesAsString}>`;
  }
}

export class UnionType extends AbstractType<ts.TypeFlags.Union> {
  types?: Type[];

  constructor(types?: Type[]) {
    super(ts.TypeFlags.Union);

    this.types = types;
  }

  toString() {
    if (this.types === undefined) {
      return super.toString();
    }

    const possibleTypesAsString: string = this.types.map((type) => type.toString()).join(' | ');

    return `${super.toString()}<${possibleTypesAsString}>`;
  }
}

export class IntersectionType extends AbstractType<ts.TypeFlags.Intersection> {
  constructor() {
    super(ts.TypeFlags.Intersection);
  }
}

export class UnionOrIntersectionType extends AbstractType<ts.TypeFlags.UnionOrIntersection> {
  constructor() {
    super(ts.TypeFlags.UnionOrIntersection);
  }
}

export class ArrayType extends ObjectType {
  type?: Type;

  constructor(type?: Type) {
    super(undefined, ts.ObjectFlags.Reference);

    this.type = type;
  }

  toString() {
    if (!this.type) {
      return 'Array';
    }

    const referencedTypeAsString: string = this.type.toString();

    return `Array<${referencedTypeAsString}>`;
  }
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
  | VoidType
  | UndefinedType
  | NullType
  | NeverType
  | ObjectType
  | UnionType
  | IntersectionType
  | UnionOrIntersectionType;

// Factories

export const any = (): AnyType => {
  return new AnyType();
};
export const unknown = (): UnknownType => {
  return new UnknownType();
};

export const string = (): StringType => {
  return new StringType();
};

export const number = (): NumberType => {
  return new NumberType();
};

export const boolean = (): BooleanType => {
  return new BooleanType();
};

export const enumeration = (): EnumType => {
  return new EnumType();
};

export const bigint = (): BigIntType => {
  return new BigIntType();
};

export const stringLiteral = (value?: string): StringLiteralType => {
  return new StringLiteralType(value);
};

export const numberLiteral = (value?: number): NumberLiteralType => {
  return new NumberLiteralType(value);
};

export const booleanLiteral = (value?: boolean): BooleanLiteralType => {
  return new BooleanLiteralType(value);
};

export const object = (properties?: Record<string, Type>): ObjectType => {
  return new ObjectType(properties);
};

export const union = (types?: Type[]): UnionType => {
  return new UnionType(types);
};

export const array = (type?: Type): ArrayType => {
  return new ArrayType(type);
};
