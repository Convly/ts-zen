import ts from 'typescript';
import type * as t from '@tsz/types';

export interface MatcherState {
  isNot: boolean;
}

export interface MatcherContext {
  originalTypeName: string;
  path: string;

  symbols: Record<string, ts.Symbol>;
  diagnostics: ts.Diagnostic[];
  checker: ts.TypeChecker;
  sourceFile: ts.SourceFile;
  program: ts.Program;

  getState(): MatcherState;
  setState(state: Partial<MatcherState>): void;

  // Alias for getState().isNot
  get isNot(): boolean;

  symbol: ts.Symbol | undefined;
  type: ts.Type | undefined;
  statement: ts.Statement | undefined;
}

export interface InverseMatchers {
  not: Matchers;
}

export interface Matchers<R extends void | Promise<void> = void | Promise<void>> {
  /**
   * Check if the expected string matches the raw string representation of the current type
   */
  equals(expected: string): R;

  /**
   * Check that the given type has arguments.
   *
   * If an expected value is provided, also check that the type arguments matches the expected ones.
   *
   * @experimental - WIP
   */
  hasArguments(expected: Record<string, t.Type>): R;

  /**
   * Check that the given type has an exact number of defined arguments
   */
  hasNbArguments(expected: number): R;

  /**
   * Generic check based on the given type
   */
  is(expected: t.Type): R;

  /**
   * Check if the given type is an anonymous object
   *
   * If an expected value is provided, also check the type's value
   */
  isAnonymousObject(expected?: Pick<t.AnonymousObjectType, 'indexes' | 'properties'>): R;

  /**
   * Check if the given type is `any`
   */
  isAny(): R;

  /**
   * Check if the given type is an array
   */
  isArray(expected?: t.ArrayType['type']): R;

  /**
   * Check if the given type is a bigint
   */
  isBigInt(): R;

  /**
   * Check if the given type is a bigint literal
   *
   * If an expected value is provided, also check the type's value
   *
   * @experimental
   */
  isBigIntLiteral(expected?: bigint): R;

  /**
   * Check if the given type is a boolean
   */
  isBoolean(): R;

  /**
   * Check if the given type is a boolean literal.
   *
   If an expected value is provided, also check the type's value
   */
  isBooleanLiteral(expected?: boolean): R;

  /**
   * Check that the current type is defined in the test context
   */
  isDefined(): R;

  /**
   * Check if the given type is a mapped type
   *
   * If an expected value is provided, also check the type's value
   */
  isMappedType(expected?: Pick<t.MappedObjectType, 'properties' | 'templateType'>): R;

  /**
   * Check if the given type is `never`
   */
  isNever(): R;

  /**
   * Check that the current type is not defined in the test context
   */
  isNotDefined(): R;

  /**
   * Check if the given type is `null`
   */
  isNull(): R;

  /**
   * Check if the given type is a number
   */
  isNumber(): R;

  /**
   * Check if the given type is a number literal
   *
   * If an expected value is provided, also check the type's value
   */
  isNumberLiteral(expected?: number): R;

  /**
   * Check if the given type is an object
   *
   * If an expected value is provided, also check that the object's properties type matches the expected ones.
   *
   * @experimental - This checker's expected value check is currently tested only on anonymous object. However, the type check should work for any kind of object.
   */
  isObject(expected?: t.ObjectType): R;

  /**
   * Check if the given type is a string
   */
  isString(): R;

  /**
   * Check if the given type is a string literal
   *
   * If an expected value is provided, also check the type's value
   */
  isStringLiteral(expected?: string): R;

  /**
   * Check if the given type is an ESSymbol
   *
   * If `expected.unique` is set to true, checks against a UniqueESSymbol instead
   */
  isSymbol(expected?: { unique?: boolean }): R;

  /**
   * Check if the given type is a template literal
   *
   * If an expected value is provided, also check the type's value
   */
  isTemplateLiteral(expected?: (string | t.Type)[]): R;

  /**
   * Check if the given type is a tuple
   *
   * If an expected value is provided, also check the type's value
   */
  isTuple(expected?: t.Type[]): R;

  /**
   * Check if the given type is a type reference object.
   *
   * If a typeName parameter is provided, also check the reference's target name.
   *
   * If an args parameter is provided, also check the declared parameters.
   */
  isTypeReference(typeName?: string, args?: Record<string, t.Type>): R;

  /**
   * Check if the given type is `undefined`
   */
  isUndefined(): R;

  /**
   * Check if the given type a union type.
   *
   * If an expected value is provided, also check that the union's members matches the expected ones.
   */
  isUnion(expected?: t.UnionType['types']): R;

  /**
   * Check if the given type is `unknown`
   */
  isUnknown(): R;

  /**
   * Check if the given type is `void`
   */
  isVoid(): R;
}

export type MatchersObject = {
  [name in keyof Matchers]: (
    this: MatchersObject,
    context: MatcherContext,
    ...params: Parameters<Matchers[name]>
  ) => ExpectResult;
};

export type ExpectResult = { pass: boolean; message: () => string };

export interface CreateMatchersOptions {
  symbols: Record<string, ts.Symbol>;
  diagnostics: ts.Diagnostic[];
  checker: ts.TypeChecker;
  sourceFile: ts.SourceFile;
  program: ts.Program;
}

export interface MatchersUtils {
  setState(state: Partial<MatcherState>): void;
  getState(): MatcherState;

  getContext(): MatcherContext;
}

export type CreateMatchersResult = {
  matchers: MatchersObject;
  matchersUtils: MatchersUtils;
};
