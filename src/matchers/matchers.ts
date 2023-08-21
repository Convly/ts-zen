import type { MatchersObject } from '@tsz/matchers/types';

import ts from 'typescript';
import * as jestUtils from 'jest-matcher-utils';

import { ExpectationError } from '@tsz/errors';
import * as utils from '@tsz/matchers/utils';
import * as t from '@tsz/types';
import { ensureDefined, ensureTypeReference } from '@tsz/matchers/utils';

export const getMatchers = (): MatchersObject => ({
  equals(context, expected) {
    const matcherName = 'equals';

    ensureDefined(context.type, matcherName, context);

    const received = context.checker.typeToString(
      context.type,
      context.sourceFile.endOfFileToken,
      ts.TypeFormatFlags.InTypeAlias
    );

    return {
      pass: received === expected,
      message: () =>
        jestUtils.matcherHint(matcherName, context.path, expected, { isNot: context.isNot }) +
        '\n\n' +
        jestUtils.printDiffOrStringify(expected, received, 'Expected', 'Received', false),
    };
  },

  hasArguments(context, expected) {
    const matcherName = 'hasArguments';

    utils.ensureDefined(context.type, matcherName, context);
    utils.ensureTypeReference(context.type, matcherName, context);

    const args = context.checker.getTypeArguments(context.type);

    const nbReceivedArgs = args.length;
    const nbExpectedArgs = Object.keys(expected).length;

    const stringifiedArgs = Object.entries(expected).reduce(
      (acc, [key, type]) => ({ ...acc, [key]: type.toString() }),
      {}
    );

    if (nbReceivedArgs !== nbExpectedArgs) {
      return {
        pass: false,
        message: () =>
          jestUtils.matcherHint(
            matcherName,
            context.path,
            JSON.stringify(stringifiedArgs, null, 2),
            {
              isNot: context.isNot,
            }
          ) +
          '\n\n' +
          jestUtils.printDiffOrStringify(
            expected.length,
            args.length,
            'Expected',
            'Received',
            false
          ),
      };
    }

    console.log(
      context.checker.typeToString(
        context.type,
        context.sourceFile.endOfFileToken,
        ts.TypeFormatFlags.InTypeAlias
      )
    );

    type Mapper = { sources: ts.TypeParameter[]; targets: ts.Type[] };

    if (!('mapper' in context.type) || context.type.mapper === undefined) {
      const expectations = args.map((paramType, i) => {
        const paramSymbol = paramType.symbol;
        const paramStatement = utils.getStatementFromSymbol(context.sourceFile, paramSymbol);

        const paddedParameterString = Array.from({ length: i }).fill('_').concat('T').join(',');

        const paramContext = utils.contextFrom(context, {
          type: paramType,
          symbol: paramSymbol,
          statement: paramStatement,
          path: `${context.path}<${paddedParameterString}>`,
        });

        return utils.safeExpect(() => this.is(paramContext, Object.values(expected)[i]));
      });

      for (const e of expectations) {
        if (!e.pass) {
          return e;
        }
      }

      return { pass: true, message: () => '' };
    }

    const mapper = context.type.mapper as Mapper;

    const received = mapper.sources
      .map((source) => source.symbol.escapedName)
      .reduce(
        (acc, name, i) => ({ ...acc, [name.toString()]: mapper.targets[i] }),
        {} as Record<string, ts.TypeParameter>
      );

    console.log(received);

    for (const [typeParameterName, type] of Object.entries(expected)) {
      const actualTypeParameter = received[typeParameterName];

      if (actualTypeParameter === undefined) {
        throw new ExpectationError(
          () => `${typeParameterName} doesn't exist in the received object`
        );
      }

      const newContext = utils.contextFrom(context, {
        type: actualTypeParameter,
        symbol: actualTypeParameter?.symbol,
        statement: utils.getStatementFromSymbol(context.sourceFile, actualTypeParameter?.symbol),
        path: `${context.path}<${typeParameterName}>`,
      });

      const expectation = this.is(newContext, type);

      if (!expectation.pass) {
        return expectation;
      }
    }

    return { pass: true, message: () => '' };
  },

  hasNbArguments(context, expected) {
    const matcherName = 'hasNbArguments';

    utils.ensureDefined(context.type, matcherName, context);
    utils.ensureTypeReference(context.type, matcherName, context);

    const args = context.checker.getTypeArguments(context.type);

    return {
      pass: args.length === expected,
      message: () =>
        jestUtils.matcherHint(matcherName, context.path, expected.toString(), {
          isNot: context.isNot,
        }) +
        '\n\n' +
        jestUtils.printDiffOrStringify(expected, args.length, 'Expected', 'Received', true),
    };
  },

  is(context, expected) {
    if (expected instanceof t.StringType) {
      return this.isString(context);
    }

    if (expected instanceof t.StringLiteralType) {
      return this.isStringLiteral(context, expected.value);
    }

    if (expected instanceof t.NumberType) {
      return this.isNumber(context);
    }

    if (expected instanceof t.NumberLiteralType) {
      return this.isNumberLiteral(context, expected.value);
    }

    if (expected instanceof t.BooleanType) {
      return this.isBoolean(context);
    }

    if (expected instanceof t.BooleanLiteralType) {
      return this.isBooleanLiteral(context, expected.value);
    }

    if (expected instanceof t.UnionType) {
      return this.isUnion(context, expected.types);
    }

    if (expected instanceof t.ArrayType) {
      return this.isArray(context, expected);
    }

    // Object can be inherited and should be checked last
    if (expected instanceof t.ObjectType) {
      return this.isObject(context, expected);
    }

    return {
      pass: false,
      message: () => `matcher not implemented for ${utils.stringifyTypeFlags(expected.flags)}`,
    };
  },

  isArray(context, expected) {
    const matcherName = 'isArray';

    utils.ensureDefined(context.type, matcherName, context);

    if (!utils.isArrayType(context.type, context.checker)) {
      return {
        pass: false,
        message: () => {
          return utils.printUnexpectedType(
            'Array',
            utils.stringifyTsType(context.type, context),
            matcherName,
            context
          );
        },
      };
    }

    return utils.safeExpect(() =>
      expected ? this.hasArguments(context, { T: expected }) : this.hasNbArguments(context, 1)
    );
  },

  isBoolean(context) {
    const matcherName = 'isBoolean';

    utils.ensureDefined(context.type, matcherName, context);

    // A boolean type is represented by a union of boolean values
    return utils.expectType(
      context.type,
      ts.TypeFlags.Union | ts.TypeFlags.Boolean,
      matcherName,
      context
    );
  },

  // TODO: Implement message formatting
  isBooleanLiteral(context, expected) {
    const matcherName = 'isBooleanLiteral';

    utils.ensureDefined(context.type, matcherName, context);

    const typeExpectation = utils.expectType(
      context.type,
      ts.TypeFlags.BooleanLiteral,
      matcherName,
      context
    );

    if (!typeExpectation.pass || expected === undefined) {
      return typeExpectation;
    }

    if (!('intrinsicName' in context.type)) {
      throw new ExpectationError(() => 'unknown error, invalid literal boolean type');
    }

    const received = context.type.intrinsicName as string;
    const pass = received === String(expected);

    return {
      pass,
      message: pass ? () => `got ${expected}` : () => `expected ${expected} got ${received}`,
    };
  },

  isDefined(context) {
    const matcherName = 'isDefined';
    const pass = context.type !== undefined;

    const message = () =>
      jestUtils.matcherHint(matcherName, context.originalTypeName, '', { isNot: context.isNot }) +
      '\n\n' +
      `Received: ${jestUtils.printReceived(utils.stringifyTsType(context.type, context))}`;

    return { pass, message };
  },

  isNotDefined(context) {
    const matcherName = 'isNotDefined';

    const pass = context.type === undefined;

    const message = () =>
      jestUtils.matcherHint(matcherName, context.originalTypeName, '', { isNot: context.isNot }) +
      '\n\n' +
      `Received: ${jestUtils.printReceived(utils.stringifyTsType(context.type, context))}`;

    return { pass, message };
  },

  isNumber(context) {
    const matcherName = 'isNumber';

    utils.ensureDefined(context.type, matcherName, context);

    return utils.expectType(context.type, ts.TypeFlags.Number, matcherName, context);
  },

  isNumberLiteral(context, expected) {
    const matcherName = 'isNumberLiteral';

    utils.ensureDefined(context.type, matcherName, context);

    return utils.expectLiteral(
      context.type,
      ts.TypeFlags.NumberLiteral,
      expected,
      matcherName,
      context
    );
  },

  isObject(context, expected?: t.ObjectType) {
    const matcherName = 'isObject';

    utils.ensureDefined(context.type, matcherName, context);

    // TODO: Redirect to various object checks instead of only checking raw object -- Once Object.(anonymous|array|interface|class|...) are available
    const typeExpectation = utils.expectType(
      context.type,
      ts.TypeFlags.Object,
      matcherName,
      context
    );

    if (!typeExpectation.pass || !expected?.properties) {
      return typeExpectation;
    }

    const objectProperties = context.type.getProperties();

    const expectedKeys = Object.keys(expected.properties);
    const objectKeys = objectProperties.map((prop) => prop.escapedName.toString());

    const keysInObjectButNotInExpected = utils.arrayDiff(objectKeys, expectedKeys);
    const keysInExpectedButNotInObject = utils.arrayDiff(expectedKeys, objectKeys);

    if (keysInObjectButNotInExpected.length > 0 || keysInExpectedButNotInObject.length > 0) {
      return {
        pass: false,
        message: () =>
          `expected object to have properties ${expectedKeys}, but received ${objectKeys}`,
      };
    }

    for (const symbol of objectProperties) {
      const propertyName = symbol.escapedName.toString();
      const expectedPropertyValue = expected.properties[propertyName];

      const type = context.checker.getTypeOfSymbol(symbol);
      const statement = utils.getStatementFromSymbol(context.sourceFile, symbol);
      const newContext = utils.contextFrom(context, { type, symbol, statement });

      const propertyExpectation = utils.safeExpect(() =>
        this.is(newContext, expectedPropertyValue)
      );

      if (!propertyExpectation.pass) {
        return {
          pass: false,
          message: () => `Invalid type for "${propertyName}": ${propertyExpectation.message()}`,
        };
      }
    }

    return { pass: true, message: () => 'is indeed an object' };
  },

  isString(context) {
    const matcherName = 'isString';

    utils.ensureDefined(context.type, matcherName, context);

    return utils.expectType(context.type, ts.TypeFlags.String, matcherName, context);
  },

  isStringLiteral(context, expected) {
    const matcherName = 'isStringLiteral';

    utils.ensureDefined(context.type, matcherName, context);

    return utils.expectLiteral(
      context.type,
      ts.TypeFlags.StringLiteral,
      expected,
      matcherName,
      context
    );
  },

  isTypeReference(context, typeName, args) {
    const matcherName = 'isTypeReference';

    ensureDefined(context.type, matcherName, context);
    ensureTypeReference(context.type, matcherName, context);

    if (!typeName) {
      return { pass: true, message: () => '' };
    }

    const { node } = context.type;
    const { aliasSymbol } = context.checker.getTypeAtLocation(node!);

    const targetName = aliasSymbol?.escapedName;
    const hasCorrectTarget = targetName === typeName;

    if (!hasCorrectTarget) {
      throw new ExpectationError(
        () =>
          jestUtils.matcherHint(matcherName, context.path, typeName, { isNot: context.isNot }) +
          '\n\n' +
          jestUtils.printDiffOrStringify(typeName, targetName, 'Expected', 'Received', false)
      );
    }

    if (!args) {
      return { pass: true, message: () => '' };
    }

    return this.hasArguments(context, args);
  },

  // TODO: Better message formatting
  isUnion(context, expected) {
    const matcherName = 'isUnion';

    utils.ensureDefined(context.type, matcherName, context);

    const typeExpectation = utils.expectType(
      context.type,
      ts.TypeFlags.Union,
      matcherName,
      context
    );

    if (!typeExpectation.pass || expected === undefined) {
      return typeExpectation;
    }

    const unionType = context.type as ts.UnionType;

    const expectationResults = unionType.types.map((type) => {
      const symbol: ts.Symbol | undefined = type.symbol;
      const statement = utils.getStatementFromSymbol(context.sourceFile, symbol);

      const newContext = utils.contextFrom(context, { type, symbol, statement });

      return {
        type,
        expectations: expected.map((expectedType) => ({
          expected: expectedType,
          result: utils.safeExpect(() => this.is(newContext, expectedType)),
        })),
      };
    });

    for (const result of expectationResults) {
      const { type, expectations } = result;

      const matches = expectations.filter((exp) => exp.result.pass);
      const hasAtLeastOneMatch = matches.length > 0;

      if (!hasAtLeastOneMatch) {
        throw new ExpectationError(
          () => `Got unexpected type ${utils.stringifyTsType(type, context)} in union type`
        );
      }
    }

    const unmatchedTypes = Array.from({ length: expected.length })
      .map((_, i) =>
        expectationResults.every((exp) => !exp.expectations[i].result.pass) ? i : null
      )
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (unmatchedTypes.length > 0) {
      throw new ExpectationError(
        () =>
          `The following type were not found in the union: ${unmatchedTypes.map((i) =>
            expected[i].toString()
          )}`
      );
    }

    return { pass: true, message: () => 'union is good' };
  },
});
