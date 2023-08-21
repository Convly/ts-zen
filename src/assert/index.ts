import ts from 'typescript';

import { createWrappedMatchers, InverseMatchers, Matchers } from '@tsz/matchers';

type TestCaseKeys<T extends object = object> = [keyof T] extends [never]
  ? string
  : Extract<keyof T, string>;

export type AssertTypeSelector<TNamespace extends object = object> = (
  typeName: TestCaseKeys<TNamespace>
) => Matchers & InverseMatchers;

export function createAssertTypeSelector<TNamespace extends object = object>(
  symbols: Record<string, ts.Symbol>,
  diagnostics: ts.Diagnostic[],
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  program: ts.Program
): AssertTypeSelector<TNamespace> {
  function typeSelector<TTypeName extends TestCaseKeys<TNamespace>>(typeName: TTypeName) {
    const context = { symbols, diagnostics, checker, sourceFile, program };

    const { matchers, matchersUtils } = createWrappedMatchers(typeName, context);

    // Make sure the matchers' state has a consistent default value
    matchersUtils.setState({ isNot: false });

    return matchers;
  }

  return typeSelector;
}
