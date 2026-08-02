type Result<T, E = Error> = [null, T] | [E, null];

/**
 * Try to execute a promise and return the result or an error
 * @param promise - The promise to execute
 * @returns A tuple containing the result or an error like: [error, response]
 */
export async function tryCatch<T, E = Error>(promise: Promise<T>): Promise<Result<T, E>> {
  try {
    const res = await promise;
    return [null, res];
  } catch (error) {
    return [error as E, null];
  }
}
