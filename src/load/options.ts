import ts from 'typescript';
import fs from 'fs';

function convertConfigToCompilerOptions(opts: { compilerOptions: ts.CompilerOptions }) {
  const { options, errors } = ts.parseJsonConfigFileContent(
    {
      ...opts,
      // if files are not specified then parseJsonConfigFileContent
      // will use ParseConfigHost to collect files in containing folder
      files: [],
    },
    ts.sys,
    ''
  );

  // Remove the following error:
  // { messageText: "The 'files' list in config file 'tsconfig.json' is empty.", category: 1, code: 18002 }
  const relevantErrors = errors.filter((e) => e.code !== 18002);
  if (relevantErrors.length > 0) {
    throw relevantErrors;
  }

  return options;
}

/**
 * Get the TypeScript compiler options
 */
export const getOptions = (
  customOptions: ts.CompilerOptions = {},
  ignoreProjectOptions = false
): ts.CompilerOptions => {
  if (ignoreProjectOptions) {
    return customOptions;
  }

  const maybeFile = ts.findConfigFile(__dirname, fs.existsSync);
  if (maybeFile === undefined) {
    throw new Error('setOptions: Cannot find tsconfig.json');
  }

  const { config, error } = ts.readConfigFile(maybeFile, (path) =>
    fs.readFileSync(path).toString()
  );

  if (error !== undefined) {
    throw new Error(`TS${error.code}: ${error.file}:${error.start} ${error.messageText}`);
  }

  const parsedConfig = convertConfigToCompilerOptions(config);

  return { ...parsedConfig, ...customOptions };
};
