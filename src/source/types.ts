import type ts from 'typescript';

export enum SourceKind {
  Record,
  File,
  Raw,
}

export interface Source {
  readonly kind: SourceKind;

  getOptions(): SourceOptions | undefined;

  toString(): string;
}

export interface SourceOptions {
  compilerOptions?: ts.CompilerOptions;
  raw?: string;
}

export interface RecordTypeDeclaration {
  params?: string[];
  definition: string;
}
