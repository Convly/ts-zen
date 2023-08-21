type String = string;

type StringLiteral = 'Hello World!';

type StringTemplate = `Hello ${string}!`

type FalseStringAsNumber = 42;
type FalseStringAsBoolean = true;
type FalseStringAsArray = string[];

export {
  String, StringLiteral, StringTemplate, FalseStringAsNumber, FalseStringAsBoolean, FalseStringAsArray
};
