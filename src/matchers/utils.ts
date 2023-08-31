import type { ExpectResult, MatcherContext } from '@tsz/matchers';

import ts from 'typescript';
import * as jestUtils from 'jest-matcher-utils';

import { ExpectationError } from '@tsz/errors';

export const arrayDiff = (a: string[], b: string[]) => a.filter((item) => !b.includes(item));

export const isOfType = <T extends ts.Type = ts.Type>(
  type: ts.Type,
  flags: ts.TypeFlags
): type is T => {
  return type.flags === flags;
};

export function isArrayType(type: ts.Type, checker: ts.TypeChecker): type is ts.TypeReference {
  return checker.isArrayType(type);
}

export function isTupleType(type: ts.Type, checker: ts.TypeChecker): type is ts.TupleType {
  return checker.isTupleType(type);
}

export const safeExpect = (callback: () => ExpectResult): ExpectResult => {
  try {
    return callback();
  } catch (e) {
    if (e instanceof ExpectationError) {
      return { pass: false, message: e.getMessage };
    }
    // re-throw other errors
    else throw e;
  }
};

export const contextFrom = (
  initialContext: MatcherContext,
  context: Partial<MatcherContext>
): MatcherContext => ({ ...initialContext, ...context });

export const extractAllTypeFlags = <T extends ts.TypeFlags>(flags?: T): T[] => {
  if (!flags) {
    return [];
  }

  return (
    Object.values(ts.TypeFlags)
      // Half of enum items are keys and half are values, so we need to filter by index
      .filter((flag): flag is T => typeof flag === 'number' && flag === (flag & flags))
  );
};

export const extractAllObjectFlags = <T extends ts.ObjectFlags>(flags?: T): T[] => {
  if (!flags) {
    return [];
  }

  return (
    Object.values(ts.ObjectFlags)
      // Half of enum items are keys and half are values, so we need to filter by index
      .filter((flag): flag is T => typeof flag === 'number' && flag === (flag & flags))
  );
};

export const stringifyTypeFlags = <T extends ts.TypeFlags>(flags?: T) => {
  const allFlags = extractAllTypeFlags(flags).sort((a, b) => (a < b ? 1 : -1));

  const toString = (flag: ts.TypeFlags) => ts.TypeFlags[flag];

  const [baseFlag, ...params] = allFlags.map(toString);

  if (params.length === 0) {
    return baseFlag;
  }

  return `${baseFlag}<${params.join(',')}>`;
};

export const stringifyObjectFlags = <T extends ts.ObjectFlags>(flags?: T) => {
  const toString = (flag: ts.ObjectFlags) => ts.ObjectFlags[flag];

  const allFlags = extractAllObjectFlags(flags)
    .sort((a, b) => (a < b ? 1 : -1))
    .map(toString);

  if (allFlags.length === 0) {
    return '';
  }

  return allFlags.join(', ');
};

export const stringifyTsType = <T extends ts.Type>(
  type: T | undefined,
  context: MatcherContext
) => {
  return type
    ? context.checker.typeToString(
        type,
        context.sourceFile.endOfFileToken,
        ts.TypeFormatFlags.InTypeAlias
      )
    : 'undefined';
};

export function ensureDefined<T>(
  expected: T,
  matcherName: string,
  context: MatcherContext
): asserts expected is NonNullable<T> {
  if (expected === undefined || expected === null) {
    const message = () =>
      jestUtils.matcherErrorMessage(
        jestUtils.matcherHint(matcherName, context.path, '', { isNot: context.isNot }),
        'this matcher expects a valid type name',
        jestUtils.printWithType('Expected', expected, jestUtils.printExpected)
      );

    throw new ExpectationError(message);
  }
}

export function ensureObject(
  expected: ts.Type,
  matcherName: string,
  context: MatcherContext
): asserts expected is ts.ObjectType {
  if (!isOfType(expected, ts.TypeFlags.Object)) {
    const message = () =>
      jestUtils.matcherErrorMessage(
        jestUtils.matcherHint(matcherName, context.path, '', { isNot: context.isNot }),
        'this matcher expects a valid object type',
        jestUtils.printWithType('Expected', expected, jestUtils.printExpected)
      );

    throw new ExpectationError(message);
  }
}

export function ensureTypeReference(
  type: ts.Type,
  matcherName: string,
  context: MatcherContext
): asserts type is ts.TypeReference {
  const isTypeReference =
    isOfType<ts.ObjectType>(type, ts.TypeFlags.Object) &&
    extractAllObjectFlags(type.objectFlags).includes(ts.ObjectFlags.Reference);

  if (!isTypeReference) {
    const message = () =>
      jestUtils.matcherErrorMessage(
        jestUtils.matcherHint(matcherName, context.path, '', { isNot: context.isNot }),
        'this matcher expects a type reference',
        `Received: ${jestUtils.printReceived(
          context.checker.typeToString(
            type,
            context.sourceFile.endOfFileToken,
            ts.TypeFormatFlags.InTypeAlias
          )
        )}`
      );

    throw new ExpectationError(message);
  }
}

export function ensureTemplateLiteral(
  type: ts.Type,
  matcherName: string,
  context: MatcherContext
): asserts type is ts.TemplateLiteralType {
  const isTemplateLiteral = isOfType<ts.TemplateLiteralType>(type, ts.TypeFlags.TemplateLiteral);

  if (!isTemplateLiteral) {
    const message = () =>
      jestUtils.matcherErrorMessage(
        jestUtils.matcherHint(matcherName, context.path, '', { isNot: context.isNot }),
        'this matcher expects a template literal',
        `Received: ${jestUtils.printReceived(
          context.checker.typeToString(
            type,
            context.sourceFile.endOfFileToken,
            ts.TypeFormatFlags.InTypeAlias
          )
        )}`
      );

    throw new ExpectationError(message);
  }
}

export const expectLiteral = <T extends ts.Type>(
  type: T,
  flags: ts.TypeFlags,
  expected: ts.LiteralType['value'] | undefined,
  matcherName: string,
  context: MatcherContext
): ExpectResult => {
  const hasCorrectFlags = isOfType<ts.LiteralType>(type, flags);

  if (!hasCorrectFlags) {
    return {
      pass: false,
      message: () =>
        jestUtils.matcherHint(matcherName, context.path, '', { isNot: context.isNot }) +
        '\n\n' +
        jestUtils.printDiffOrStringify(
          stringifyTypeFlags(type.flags),
          stringifyTypeFlags(flags),
          'Expected',
          'Received',
          false
        ),
    };
  }

  return {
    pass: expected === undefined ? true : expected === type.value,
    message: () =>
      jestUtils.matcherHint(matcherName, context.path, String(expected), { isNot: context.isNot }) +
      '\n\n' +
      jestUtils.printDiffOrStringify(expected, type.value, 'Expected', 'Received', true),
  };
};

export const expectType = <T extends ts.Type>(
  type: T,
  flags: ts.TypeFlags,
  matcherName: string,
  context: MatcherContext
) => {
  const pass = isOfType(type, flags);
  const stringifiedFlags = stringifyTypeFlags(flags);

  const message = () => {
    return printUnexpectedType(
      stringifiedFlags,
      pass ? stringifiedFlags : stringifyTsType(context.type, context),
      matcherName,
      context
    );
  };

  return { pass, message };
};

export const printUnexpectedType = (
  expected: string,
  received: string,
  matcherName: string,
  context: MatcherContext
) => {
  return (
    jestUtils.matcherHint(matcherName, context.path, '', {
      isNot: context.isNot,
    }) +
    '\n\n' +
    jestUtils.printDiffOrStringify(expected, received, 'Expected', 'Received', false)
  );
};

export const getStatementFromSymbol = (sourceFile: ts.SourceFile, symbol?: ts.Symbol) => {
  if (symbol === undefined) {
    return undefined;
  }

  return sourceFile.statements.find((statement) => {
    // For some reason Symbol & Type don't expose "id" in their definitions, but it's there in this context.
    // Also, statements might not have symbols attached to them
    const statementSymbolId = (statement as any).symbol?.id;
    const actualSymbolId = (symbol as any).id;

    return statementSymbolId === actualSymbolId;
  });
};

export const ok = (message?: () => string): ExpectResult => ({
  pass: true,
  message: message ?? (() => ''),
});
