export class ExpectationError extends Error {
  public readonly getMessage: () => string;

  constructor(getMessage: () => string) {
    super();

    this.getMessage = getMessage;
  }
}
