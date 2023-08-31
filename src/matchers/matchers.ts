import type { MatchersObject } from '@tsz/matchers/types';

import ts, { TypeFlags } from 'typescript';
import * as jestUtils from 'jest-matcher-utils';

import { ExpectationError } from '@tsz/errors';
import * as utils from '@tsz/matchers/utils';
import * as t from '@tsz/types';

export const getMatchers = (): MatchersObject => ({
  equals(context, expected) {
    const matcherName = 'equals';

    utils.ensureDefined(context.type, matcherName, context);

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

      return utils.ok(() =>
        jestUtils.matcherHint(matcherName, context.path, '', { isNot: context.isNot })
      );
    }

    const mapper = context.type.mapper as Mapper;

    const received = mapper.sources
      .map((source) => source.symbol.escapedName)
      .reduce(
        (acc, name, i) => ({ ...acc, [name.toString()]: mapper.targets[i] }),
        {} as Record<string, ts.TypeParameter>
      );

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

    return utils.ok(() =>
      jestUtils.matcherHint(matcherName, context.path, '', { isNot: context.isNot })
    );
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
    const matcherName = 'is';

    switch (expected.kind) {
      case t.TypeKind.Any:
        return this.isAny(context);
      case t.TypeKind.Array:
        return this.isArray(context, expected.type);
      case t.TypeKind.Unknown:
        return this.isUnknown(context);
      case t.TypeKind.String:
        return this.isString(context);
      case t.TypeKind.Number:
        return this.isNumber(context);
      case t.TypeKind.Boolean:
        return this.isBoolean(context);
      case t.TypeKind.BigInt:
        return this.isBigInt(context);
      case t.TypeKind.StringLiteral:
        return this.isStringLiteral(context, expected.value);
      case t.TypeKind.NumberLiteral:
        return this.isNumberLiteral(context, expected.value);
      case t.TypeKind.BooleanLiteral:
        return this.isBooleanLiteral(context, expected.value);
      case t.TypeKind.BigIntLiteral:
        return this.isBigIntLiteral(context, expected.value); // fix me
      case t.TypeKind.Void:
        return this.isVoid(context);
      case t.TypeKind.Undefined:
        return this.isUndefined(context);
      case t.TypeKind.Null:
        return this.isNull(context);
      case t.TypeKind.Never:
        return this.isNever(context);
      case t.TypeKind.Object:
        return this.isObject(context, expected);
      case t.TypeKind.Union:
        return this.isUnion(context);
      case t.TypeKind.TemplateLiteral:
        return this.isTemplateLiteral(context, expected.template);
      case t.TypeKind.Symbol:
        return this.isSymbol(context, { unique: expected.unique });
      case t.TypeKind.Tuple:
        return this.isTuple(context, expected.types);
      case t.TypeKind.Intersection:
      case t.TypeKind.Enum:
        break;
    }

    throw new ExpectationError(() =>
      jestUtils.matcherErrorMessage(
        jestUtils.matcherHint(matcherName, context.path, expected?.toString(), {
          isNot: context.isNot,
        }),
        'no matcher found for the expected type',
        `Received ${jestUtils.printReceived(expected?.toString())}`
      )
    );
  },

  isAnonymousObject(context, expected) {
    const matcherName = 'isAnonymousObject';

    utils.ensureDefined(context.type, matcherName, context);
    utils.ensureObject(context.type, matcherName, context);

    const flags = utils.extractAllObjectFlags(context.type.objectFlags);
    const isAnonymousObject = flags.includes(ts.ObjectFlags.Anonymous);

    if (!isAnonymousObject) {
      return {
        pass: false,
        message: () =>
          jestUtils.matcherHint(matcherName, context.path, '', { isNot: context.isNot }) +
          '\n\n' +
          jestUtils.printDiffOrStringify(
            'Anonymous',
            flags.map((f) => ts.ObjectFlags[f]).join(' | '),
            'Expected flags',
            'Received flags',
            false
          ),
      };
    }

    const { indexes, properties } = expected ?? {};

    if (!indexes && !properties) {
      return utils.ok();
    }

    const propertiesInfo = context.checker.getPropertiesOfType(context.type);
    const indexesInfo = context.checker.getIndexInfosOfType(context.type);

    if (indexes) {
      if (indexes.length !== indexesInfo.length) {
        throw new ExpectationError(() =>
          jestUtils.matcherErrorMessage(
            jestUtils.matcherHint(matcherName, context.path, '', { isNot: context.isNot }),
            `The objects must contain the same number of indexes`,
            jestUtils.printDiffOrStringify(
              indexes.length,
              indexesInfo.length,
              'Expected indexes length',
              'Received indexes length',
              true
            )
          )
        );
      }

      for (let i = 0; i < indexes.length; i++) {
        const expectedIndex = indexes[i];
        const receivedIndex = indexesInfo[i];

        const keySymbol = receivedIndex.keyType.symbol ?? receivedIndex.keyType.aliasSymbol;
        const keyStatement = utils.getStatementFromSymbol(context.sourceFile, keySymbol);
        const keyContext = utils.contextFrom(context, {
          type: receivedIndex.keyType,
          symbol: keySymbol,
          statement: keyStatement,
          path: `${context.path}.indexes[${i}].keyType`,
        });

        const keyExpectation = utils.safeExpect(() => this.is(keyContext, expectedIndex.keyType));

        if (!keyExpectation.pass) {
          throw new ExpectationError(keyExpectation.message);
        }

        const typeSymbol = receivedIndex.type.symbol ?? receivedIndex.type.aliasSymbol;
        const typeStatement = utils.getStatementFromSymbol(context.sourceFile, typeSymbol);
        const typeContext = utils.contextFrom(context, {
          type: receivedIndex.type,
          symbol: typeSymbol,
          statement: typeStatement,
          path: `${context.path}.indexes[${i}].type`,
        });

        const typeExpectation = utils.safeExpect(() => this.is(typeContext, expectedIndex.type));

        if (!typeExpectation.pass) {
          throw new ExpectationError(typeExpectation.message);
        }
      }
    }

    if (properties) {
      if (Object.keys(properties).length !== propertiesInfo.length) {
        throw new ExpectationError(() =>
          jestUtils.matcherErrorMessage(
            jestUtils.matcherHint(matcherName, context.path, '', { isNot: context.isNot }),
            `The objects must contain the same number of properties`,
            jestUtils.printDiffOrStringify(
              Object.keys(properties).length,
              propertiesInfo.length,
              'Expected number of properties',
              'Received number of properties',
              true
            )
          )
        );
      }

      const expectedPropertiesName = Object.keys(properties).sort((a, b) => (a < b ? -1 : 1));
      const receivedPropertiesName = propertiesInfo
        .map((p) => p.escapedName)
        .sort((a, b) => (a < b ? -1 : 1));

      for (const key in properties) {
        const prop = properties[key];
        const propSymbol = propertiesInfo.find((p) => p.escapedName === key);

        if (!propSymbol) {
          throw new ExpectationError(() =>
            jestUtils.matcherErrorMessage(
              jestUtils.matcherHint(matcherName, context.path, '', { isNot: context.isNot }),
              `Properties name must match`,
              jestUtils.printDiffOrStringify(
                expectedPropertiesName,
                receivedPropertiesName,
                'Expected properties',
                'Received properties',
                true
              )
            )
          );
        }

        const propType = context.checker.getTypeOfSymbol(propSymbol);
        const propStatement = utils.getStatementFromSymbol(context.sourceFile, propSymbol);
        const propContext = utils.contextFrom(context, {
          type: propType,
          symbol: propSymbol,
          statement: propStatement,
          path: `${context.path}.${key}`,
        });

        const propExpectation = utils.safeExpect(() => this.is(propContext, prop));

        if (!propExpectation.pass) {
          throw new ExpectationError(propExpectation.message);
        }
      }
    }

    return utils.ok();
  },

  isAny(context) {
    const matcherName = 'isAny';

    utils.ensureDefined(context.type, matcherName, context);

    return utils.expectType(context.type, ts.TypeFlags.Any, matcherName, context);
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

  isBigInt(context) {
    const matcherName = 'isBigInt';

    utils.ensureDefined(context.type, matcherName, context);

    return utils.expectType(context.type, ts.TypeFlags.BigInt, matcherName, context);
  },

  isBigIntLiteral(context) {
    const matcherName = 'isBigIntLiteral';

    utils.ensureDefined(context.type, matcherName, context);
    ts.ObjectFlags;
    return utils.expectLiteral(
      context.type,
      ts.TypeFlags.BigIntLiteral,
      undefined, // todo: use the expected parameter value => cast to ts bigint
      matcherName,
      context
    );
  },

  // TODO: Implement better message formatting
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

  isMappedType(context) {
    const matcherName = 'isMappedType';

    utils.ensureDefined(context.type, matcherName, context);
    utils.ensureObject(context.type, matcherName, context);

    /**
     * Internal from typescript
     */
    // interface MappedType extends ts.ObjectType {
    //   constraintType?: ts.Type;
    //   nameType?: ts.Type;
    //   templateType?: ts.Type;
    //   modifiersType?: ts.Type;
    //   resolvedApparentType?: ts.Type;
    //   containsError?: boolean;
    // }

    const objectFlags = utils.extractAllObjectFlags(context.type.objectFlags);

    if (!objectFlags.includes(ts.ObjectFlags.Mapped)) {
      throw new ExpectationError(() =>
        jestUtils.matcherErrorMessage(
          jestUtils.matcherHint(matcherName, context.path, '', { isNot: context.isNot }),
          'this matcher expects a valid mapped type',
          jestUtils.printDiffOrStringify(
            'MappedType',
            utils.stringifyTsType(context.type, context),
            'Expected',
            'Received',
            false
          )
        )
      );
    }

    // TODO: Implement properties checks

    return utils.ok();
  },

  isNever(context) {
    const matcherName = 'isNever';

    utils.ensureDefined(context.type, matcherName, context);

    return utils.expectType(context.type, ts.TypeFlags.Never, matcherName, context);
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

  isNull(context) {
    const matcherName = 'isNull';

    utils.ensureDefined(context.type, matcherName, context);

    return utils.expectType(context.type, ts.TypeFlags.Null, matcherName, context);
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

    if (!typeExpectation.pass || !expected) {
      return typeExpectation;
    }

    switch (expected.objectKind) {
      case t.ObjectKind.Anonymous:
        const { indexes, properties } = expected;

        return this.isAnonymousObject(
          context,
          indexes || properties ? { indexes: indexes, properties: properties } : undefined
        );
      case t.ObjectKind.Mapped:
        return this.isMappedType(context);
      default:
        break;
    }

    return utils.ok();

    // const objectProperties = context.type.getProperties();
    //
    // const expectedKeys = Object.keys(expected.properties);
    // const objectKeys = objectProperties.map((prop) => prop.escapedName.toString());
    //
    // const keysInObjectButNotInExpected = utils.arrayDiff(objectKeys, expectedKeys);
    // const keysInExpectedButNotInObject = utils.arrayDiff(expectedKeys, objectKeys);
    //
    // if (keysInObjectButNotInExpected.length > 0 || keysInExpectedButNotInObject.length > 0) {
    //   return {
    //     pass: false,
    //     message: () =>
    //       jestUtils.matcherErrorMessage(
    //         jestUtils.matcherHint(matcherName, context.path, '', { isNot: context.isNot }),
    //         'Object properties mismatch',
    //         jestUtils.printDiffOrStringify(
    //           expectedKeys,
    //           objectKeys,
    //           'Expected keys',
    //           'Received keys',
    //           true
    //         )
    //       ),
    //   };
    // }
    //
    // for (const symbol of objectProperties) {
    //   const propertyName = symbol.escapedName.toString();
    //   const path = `${context.path}.${propertyName}`;
    //
    //   const expectedPropertyValue = expected.properties[propertyName];
    //   const type = context.checker.getTypeOfSymbol(symbol);
    //   const statement = utils.getStatementFromSymbol(context.sourceFile, symbol);
    //   const newContext = utils.contextFrom(context, { type, symbol, statement, path });
    //
    //   const propertyExpectation = utils.safeExpect(() =>
    //     this.is(newContext, expectedPropertyValue)
    //   );
    //
    //   if (!propertyExpectation.pass) {
    //     return propertyExpectation;
    //   }
    // }
    //
    // return utils.ok(() =>
    //   jestUtils.matcherHint(matcherName, context.path, '', { isNot: context.isNot })
    // );
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

  isTemplateLiteral(context, expected) {
    const matcherName = 'isTemplateLiteral';

    utils.ensureDefined(context.type, matcherName, context);
    utils.ensureTemplateLiteral(context.type, matcherName, context);

    if (!expected) {
      return utils.ok(() =>
        jestUtils.matcherHint(matcherName, context.path, '', { isNot: context.isNot })
      );
    }

    const { texts, types } = context.type;

    const receivedTemplate = texts
      .slice(0, -1)
      .reduce((acc, text, i) => acc.concat(text).concat(types[i]), [] as (string | ts.Type)[])
      .concat(texts.at(-1)!)
      // Remove empty string items
      .filter((item) => item !== '');

    if (receivedTemplate.length !== expected.length) {
      throw new ExpectationError(() =>
        jestUtils.matcherErrorMessage(
          jestUtils.matcherHint(matcherName, context.path, '', { isNot: context.isNot }),
          `The templates must contain the same number of items`,
          jestUtils.printDiffOrStringify(
            expected.length,
            receivedTemplate.length,
            'Expected template length',
            'Received template length',
            true
          )
        )
      );
    }

    for (let i = 0; i < expected.length; i++) {
      const path = `${context.path}[${i}]`;
      const hint = jestUtils.matcherHint(matcherName, path, undefined, { isNot: context.isNot });
      const getMessage = () =>
        hint +
        '\n\n' +
        jestUtils.printDiffOrStringify(
          expectedAsString,
          receivedAsString,
          'Expected',
          'Received',
          true
        );

      const expectedValue = expected[i];
      const receivedValue = receivedTemplate[i];

      const expectedAsString = expectedValue.toString();
      const receivedAsString =
        typeof receivedValue === 'string'
          ? receivedValue
          : utils.stringifyTsType(receivedValue, context);

      // Different types
      if (typeof receivedValue !== typeof receivedValue) {
        throw new ExpectationError(getMessage);
      }

      // Both string
      else if (typeof expectedValue === 'string' && typeof receivedValue === 'string') {
        if (expectedValue !== receivedValue) {
          throw new ExpectationError(getMessage);
        }
      }

      // t.Type & ts.Type
      else if (typeof expectedValue === 'object' && typeof receivedValue === 'object') {
        const expectedType = expectedValue;

        const receivedType = receivedValue;
        const receivedSymbol = receivedValue.symbol ?? receivedType.aliasSymbol;
        const receivedStatement = utils.getStatementFromSymbol(context.sourceFile, receivedSymbol);

        const newContext = utils.contextFrom(context, {
          type: receivedValue,
          symbol: receivedSymbol,
          statement: receivedStatement,
          path,
        });

        const expectation = utils.safeExpect(() => this.is(newContext, expectedType));

        if (!expectation.pass) {
          throw new ExpectationError(expectation.message);
        }
      }
    }

    return utils.ok(() =>
      jestUtils.matcherHint(matcherName, context.path, '', { isNot: context.isNot })
    );
  },

  isSymbol(context, expected) {
    const matcherName = 'isSymbol';

    utils.ensureDefined(context.type, matcherName, context);

    return utils.expectType(
      context.type,
      expected?.unique ? TypeFlags.UniqueESSymbol : TypeFlags.ESSymbol,
      matcherName,
      context
    );
  },

  isTuple(context, expected) {
    const matcherName = 'isTuple';
    const expectedAsString = `[${expected?.map((e) => e.toString()).join(', ')}]`;

    utils.ensureDefined(context.type, matcherName, context);

    if (!utils.isTupleType(context.type, context.checker)) {
      return {
        pass: false,
        message: () => {
          return utils.printUnexpectedType(
            expectedAsString,
            utils.stringifyTsType(context.type, context),
            matcherName,
            context
          );
        },
      };
    }

    if (!expected) {
      return utils.ok(() =>
        jestUtils.matcherHint(matcherName, context.path, expectedAsString, { isNot: context.isNot })
      );
    }

    const elements = context.checker.getTypeArguments(context.type);

    if (elements.length !== expected.length) {
      throw new ExpectationError(() =>
        jestUtils.matcherErrorMessage(
          jestUtils.matcherHint(
            matcherName,
            context.path,
            `[${expected.map((e) => e.toString()).join(', ')}]`,
            { isNot: context.isNot }
          ),
          `The expected and received tuples must have the same length`,
          jestUtils.printDiffOrStringify(
            expected.length,
            elements.length,
            'Expected length',
            'Received length',
            true
          )
        )
      );
    }

    for (let i = 0; i < expected.length; i++) {
      const path = `${context.path}[${i}]`;

      const expectedType = expected[i];

      const receivedType = elements[i];
      const receivedSymbol = receivedType.symbol ?? receivedType.aliasSymbol;
      const receivedStatement = utils.getStatementFromSymbol(context.sourceFile, receivedSymbol);

      const newContext = utils.contextFrom(context, {
        path,
        type: receivedType,
        symbol: receivedSymbol,
        statement: receivedStatement,
      });

      const expectation = utils.safeExpect(() => this.is(newContext, expectedType));

      if (!expectation.pass) {
        return expectation;
      }
    }

    return utils.ok(
      () =>
        jestUtils.matcherHint(matcherName, context.path, expectedAsString, {
          isNot: context.isNot,
        }) +
        '\n\n' +
        `Received: ${jestUtils.printReceived(utils.stringifyTsType(context.type, context))}`
    );
  },

  isTypeReference(context, typeName, args) {
    const matcherName = 'isTypeReference';

    utils.ensureDefined(context.type, matcherName, context);
    utils.ensureTypeReference(context.type, matcherName, context);

    if (!typeName) {
      return utils.ok(() =>
        jestUtils.matcherHint(matcherName, context.path, '', { isNot: context.isNot })
      );
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
      return utils.ok(() =>
        jestUtils.matcherHint(matcherName, context.path, '', { isNot: context.isNot })
      );
    }

    return this.hasArguments(context, args);
  },

  isUndefined(context) {
    const matcherName = 'isUndefined';

    utils.ensureDefined(context.type, matcherName, context);

    return utils.expectType(context.type, ts.TypeFlags.Undefined, matcherName, context);
  },

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

    return utils.ok(() =>
      jestUtils.matcherHint(matcherName, context.path, '', { isNot: context.isNot })
    );
  },

  isUnknown(context) {
    const matcherName = 'isUnknown';

    utils.ensureDefined(context.type, matcherName, context);

    return utils.expectType(context.type, ts.TypeFlags.Unknown, matcherName, context);
  },

  isVoid(context) {
    const matcherName = 'isVoid';

    utils.ensureDefined(context.type, matcherName, context);

    return utils.expectType(context.type, ts.TypeFlags.Void, matcherName, context);
  },
});
