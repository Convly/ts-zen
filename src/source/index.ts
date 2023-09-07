import ts from 'typescript';
import fs from 'fs';
import path from 'path';

import { SourceKind, Source, SourceOptions, RecordTypeDeclaration } from '@tsz/source';

const ALLOWED_FILE_EXT = ['.ts', '.d.ts'];

export function createSourceFromFile(filePath: string, options: SourceOptions = {}): Source {
  const stats = fs.statSync(filePath);

  if (!stats.isFile()) {
    throw new Error(`File not found at "${path}"`);
  }

  const extName = path.extname(filePath);

  if (!ALLOWED_FILE_EXT.includes(extName)) {
    throw new Error(
      `Invalid file extension. Found "${extName}" but expected one of the following: ${ALLOWED_FILE_EXT.join(
        ', '
      )}`
    );
  }

  const fileContent = fs.readFileSync(filePath).toString();

  /**
   * Make sure the source file baseUrl is set to the file base directory (if not overridden)
   */
  if (typeof options.baseUrl === 'undefined') {
    options.baseUrl = path.dirname(path.resolve(filePath));
  }

  return {
    kind: SourceKind.File,

    getOptions() {
      return options;
    },

    toString() {
      return fileContent;
    },
  };
}

export function createSourceFromRecord(
  record: Record<string, RecordTypeDeclaration>,
  options?: SourceOptions
): Source {
  const code = Object.entries(record)
    // Transform each type declaration into an inline type definition
    // TODO: Instead of generating raw strings, we could parse the declarations into ts nodes and emit + format them
    .map(([typeName, typeDeclaration]) => {
      const { params, definition } = typeDeclaration;

      const hasParams = params !== undefined && params.length > 0;

      return hasParams
        ? `type ${typeName}<${params.join(', ')}> = ${definition};`
        : `type ${typeName} = ${definition};`;
    })
    .join(ts.sys.newLine);

  return {
    kind: SourceKind.Record,

    getOptions() {
      return options;
    },

    toString() {
      return code;
    },
  };
}

export function createSourceFromRaw(code: string, options?: SourceOptions): Source {
  return {
    kind: SourceKind.Raw,

    getOptions() {
      return options;
    },

    toString() {
      return code;
    },
  };
}

// re-export source types
export * from './types';
