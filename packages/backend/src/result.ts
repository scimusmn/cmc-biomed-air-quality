// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// functional-programming style Result type, used instead of normal errors
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// used to disambiguate Ok vs Fail
export enum ResultType {
  Ok = 'resulttype-ok',
  Fail = 'resulttype-fail',
}

// Ok (success) type
export interface Ok<T> {
  type: typeof ResultType.Ok;
  value: T;
}
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const Ok = <T> (value: T): Ok<T> => ({ type: ResultType.Ok, value });

// Fail (error) type
export interface Fail<T> {
  type: typeof ResultType.Fail;
  value: T;
}
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const Fail = <T> (value: T): Fail<T> => ({ type: ResultType.Fail, value });

// success or failure type
export type Result<L, R> = Ok<L> | Fail<R>;

export const isOk = <L, R>(result: Result<L, R>): result is Ok<L> => result.type === ResultType.Ok;
/* eslint-disable-next-line max-len */
export const isFail = <L, R>(result: Result<L, R>): result is Fail<R> => result.type === ResultType.Fail;
