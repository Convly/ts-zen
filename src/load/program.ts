import ts from 'typescript';
import path from 'path';

import { FILENAME } from '@tsz/constants';
import { getOptions } from '@tsz/load/options';

type GetSourceFileFn = ts.CompilerHost['getSourceFile'];

const FILENAME_RE = new RegExp(FILENAME);

export const createInlineProgram = (
  code: string,
  customCompilerOptions?: ts.CompilerOptions,
  ignoreProjectOptions?: boolean,
  baseUrl?: string
) => {
  let sourceFile!: ts.SourceFile;

  const filePath = path.resolve(baseUrl ?? process.cwd(), FILENAME);

  const getSourceFile: GetSourceFileFn = (filename: string, languageVersion, ...args) => {
    if (!FILENAME_RE.test(filename)) {
      return compilerHost.getSourceFile(filename, languageVersion, ...args);
    }

    if (sourceFile === undefined) {
      sourceFile = ts.createSourceFile(filePath, code, languageVersion);
    }

    return sourceFile;
  };

  const options = getOptions(customCompilerOptions, ignoreProjectOptions);

  const compilerHost = ts.createCompilerHost(options);
  const customCompilerHost = { ...compilerHost, getSourceFile };

  const program = ts.createProgram([filePath], options, customCompilerHost);

  return { program, sourceFile };
};
