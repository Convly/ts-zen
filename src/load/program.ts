import ts from 'typescript';

import { FILENAME } from '@tsz/constants';
import { getOptions } from '@tsz/load/options';

const FILENAME_RE = new RegExp(FILENAME);

export const createInlineProgram = (
  code: string,
  customCompilerOptions?: ts.CompilerOptions,
  ignoreProjectOptions?: boolean
) => {
  type GetSourceFileFn = ts.CompilerHost['getSourceFile'];

  let sourceFile!: ts.SourceFile;

  const getSourceFile: GetSourceFileFn = (filename: string, languageVersion, ...args) => {
    if (!FILENAME_RE.test(filename)) {
      return compilerHost.getSourceFile(filename, languageVersion, ...args);
    }

    if (sourceFile === undefined) {
      sourceFile = ts.createSourceFile(FILENAME, code, languageVersion);
    }

    return sourceFile;
  };

  const options = getOptions(customCompilerOptions, ignoreProjectOptions);
  const compilerHost = ts.createCompilerHost(options);
  const customCompilerHost = { ...compilerHost, getSourceFile };

  const program = ts.createProgram([FILENAME], options, customCompilerHost);

  return { program, sourceFile };
};
