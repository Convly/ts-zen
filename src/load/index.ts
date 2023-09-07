import ts from 'typescript';

import {
  createSourceFromFile,
  createSourceFromRaw,
  createSourceFromRecord,
  RecordTypeDeclaration,
  Source,
  SourceOptions,
} from '@tsz/source';
import { createAssertTypeSelector } from '@tsz/assert';

import { createInlineProgram } from './program';

export function load(source: Source) {
  const { ignoreProjectOptions, compilerOptions, raw, baseUrl } = source.getOptions() ?? {};

  const code = sanitizeCode([raw ?? ''].concat(source.toString()).join(ts.sys.newLine));

  const { program, sourceFile } = createInlineProgram(
    code,
    compilerOptions,
    ignoreProjectOptions,
    baseUrl
  );
  const checker = program.getTypeChecker();
  const symbols = parseSymbols(checker, sourceFile);
  const diagnostics: ts.Diagnostic[] = getProgramDiagnostics(program, sourceFile);

  return createAssertTypeSelector(symbols, diagnostics, checker, sourceFile, program);
}

const sanitizeCode = (code: string) => {
  return (
    code
      // Remove @ts-expect error comments
      .replaceAll(/^[ \t]*\/\/[ \t]*@ts-expect-error.*$/gm, '')
  );
};

const getProgramDiagnostics = (program: ts.Program, sourceFile: ts.SourceFile): ts.Diagnostic[] => [
  ...program.getSyntacticDiagnostics(sourceFile),
  ...program.getSemanticDiagnostics(sourceFile),
  ...program.getDeclarationDiagnostics(sourceFile),
];

const parseSymbols = (checker: ts.TypeChecker, sourceFile: ts.SourceFile) => {
  const exportedTypes = sourceFile.statements
    .filter(
      (statement): statement is ts.ExportDeclaration =>
        statement.kind === ts.SyntaxKind.ExportDeclaration
    )
    .map((declaration) => declaration.exportClause)
    .filter((clause): clause is ts.NamedExports => clause?.kind === ts.SyntaxKind.NamedExports)
    .reduce((elements, clause) => [...elements, ...clause.elements], [] as ts.ExportSpecifier[])
    .map((specifier) => specifier.name.escapedText);

  return checker
    .getSymbolsInScope(sourceFile.endOfFileToken, ts.SymbolFlags.Type)
    .filter((symbol) => exportedTypes.includes(symbol.escapedName))
    .reduce((acc, symbol) => ({ ...acc, [symbol.name]: symbol }), {});
};

export function loadFromFile(filePath: string, options?: SourceOptions) {
  const fileSource = createSourceFromFile(filePath, options);

  return load(fileSource);
}

export function loadFromRecord(
  record: Record<string, RecordTypeDeclaration>,
  options?: SourceOptions
) {
  const recordSource = createSourceFromRecord(record, options);

  return load(recordSource);
}

export function loadFromRaw(code: string, options?: SourceOptions) {
  const rawSource = createSourceFromRaw(code, options);

  return load(rawSource);
}
