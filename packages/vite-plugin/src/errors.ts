/** An error the dev endpoints answer with as it is: the message for the person, the code as the HTTP status. */
export class RequestError extends Error {
  readonly code: number;

  constructor(message: string, code = 400) {
    super(message);
    this.code = code;
  }
}
