// Expect an error on the import path
// @ts-expect-error
import type { NoOp } from './resource/custom-lib';

type NoOpBoolean = NoOp<boolean>;

export { NoOpBoolean };
