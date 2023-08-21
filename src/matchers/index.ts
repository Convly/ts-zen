import type {
  CreateMatchersOptions,
  CreateMatchersResult,
  MatcherState,
  MatcherContext,
  MatchersObject,
  Matchers,
} from './types';

import * as matchersUtils from './utils';
import { getMatchers } from './matchers';

export const createMatchers = (
  typeName: string,
  options: CreateMatchersOptions
): CreateMatchersResult => {
  const matcherState: MatcherState = { isNot: false };

  const getState = (): MatcherState => {
    return matcherState;
  };

  const setState = (state: Partial<MatcherState>) => {
    Object.assign(matcherState, state);
  };

  const symbol = options.symbols[typeName];
  const type = symbol ? options.checker.getDeclaredTypeOfSymbol(symbol) : undefined;
  const statement = matchersUtils.getStatementFromSymbol(options.sourceFile, symbol);

  const matcherContext: MatcherContext = {
    ...options,

    originalTypeName: typeName,
    path: typeName,

    symbol,
    type,
    statement,

    getState,
    setState,

    get isNot() {
      return getState().isNot;
    },
  };

  const matchers = getMatchers();

  return {
    matchers: {
      ...matchers,

      get not() {
        setState({ isNot: true });
        return matchers;
      },
    },

    matchersUtils: {
      getState,
      setState,
      getContext() {
        return matcherContext;
      },
    },
  };
};

export const createWrappedMatchers = (typeName: string, options: CreateMatchersOptions) => {
  const { matchers, matchersUtils } = createMatchers(typeName, options);
  const matcherKeys = Object.keys(matchers) as (keyof MatchersObject)[];

  const wrappedMatchers = matcherKeys.reduce(
    (acc, matcherKey) => ({
      ...acc,
      [matcherKey]: (...params: Parameters<MatchersObject[typeof matcherKey]>) => {
        expect(typeName).toAssertTypeWith(matcherKey, params, matchers, matchersUtils);
      },
    }),
    {} as Matchers
  );

  return {
    matchers: {
      ...wrappedMatchers,

      get not() {
        matchersUtils.setState({ isNot: true });
        return wrappedMatchers;
      },
    },

    matchersUtils,
  };
};

export * as matcherUtils from './utils';
export type * from './types';
