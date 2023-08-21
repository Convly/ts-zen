import { loadFromFile, loadFromRaw, loadFromRecord } from '@tsz/load';
import { RecordTypeDeclaration, SourceOptions } from '@tsz/source';
import { AssertTypeSelector } from '@tsz/assert';

import { ExpectationError } from '@tsz/errors';
import { ExpectResult, MatchersObject, MatchersUtils } from '@tsz/matchers/types';

function fromFile(path: string, options?: SourceOptions) {
  return loadFromFile(path, options) as AssertTypeSelector;
}

function fromRecord(record: Record<string, RecordTypeDeclaration>, options?: SourceOptions) {
  return loadFromRecord(record, options);
}

function fromRaw(code: string, options?: SourceOptions) {
  return loadFromRaw(code, options);
}

export type * from '@tsz/assert';
export type * from '@tsz/source';
export type * from '@tsz/load';

export type * from '@tsz/types';
export { default as t } from '@tsz/types';

export { fromFile, fromRecord, fromRaw };

expect.extend({
  toAssertTypeWith<TMatchers extends MatchersObject, TMatcherName extends keyof TMatchers>(
    typeName: string,
    matcherName: TMatcherName,
    params: Parameters<TMatchers[TMatcherName]>,
    matchers: TMatchers,
    matcherUtils: MatchersUtils
  ) {
    if (!(matcherName in matchers)) {
      throw new Error(`Unknown matcher ${String(matcherName)} for type "${typeName}"`);
    }

    const matcher = matchers[matcherName];

    let result: ExpectResult;

    try {
      result = (matcher as Function).call(matchers, matcherUtils.getContext(), ...params);
    } catch (e) {
      // Transform expectation errors to regular expect results
      if (e instanceof ExpectationError) {
        result = { pass: false, message: e.getMessage };
      }
      // Re-throw regular errors
      else throw e;
    }

    const { pass, message } = result;

    // Extract the isNot state variable after calling the matcher to make sure it won't be modified again
    const { isNot } = matcherUtils.getState();

    return { pass: isNot ? !pass : pass, message };
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toAssertTypeWith<TMatchers extends MatchersObject, TMatcherName extends keyof TMatchers>(
        matcherName: TMatcherName,
        params: Parameters<TMatchers[TMatcherName]>,
        matchers: TMatchers,
        matchersUtils: MatchersUtils
      ): void;
    }
  }
}
