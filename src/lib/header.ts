import dedent from 'dedent';
import { HTTPMethod, isValidStatusCode, normalizeHeader, Headers } from './shared.js';
import { NEWLINE, StatusCodes } from './constants.js';

/**
 * @default protocol = 'HTTP/1.0'
 */
export abstract class BaseHeader {
  protected _protocol = 'HTTP/1.0';

  protected _headers: Headers = {};

  setProtocol(protocol: string) {
    this._protocol = protocol;
    return this;
  }

  get protocol() {
    return this._protocol;
  }

  /**
   * @note key is normalized
   */
  addHeader(key: string, value: string) {
    this._headers[normalizeHeader(key)] = value;
    return this;
  }

  getHeader(key: string): string | undefined {
    return this._headers[key];
  }

  get headers() {
    return this._headers;
  }

  abstract toString(): string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static parse(header: string): BaseHeader {
    throw new Error('Unimplemented');
  }
}

/**
 * @default protocol = 'HTTP/1.0'
 * @default method = 'GET'
 * @default path = '/'
 * @default headers.User-Agent = 'kaaaxSocket/1.0.0'
 * @default headers.Connection = 'close'
 */
export class RequestHeader extends BaseHeader {
  #method = 'GET';
  #path = '/';

  constructor() {
    super();
    this._headers['Connection'] = 'close';
    this._headers['User-Agent'] = 'kaaaxSocket/1.0.0';
  }

  setMethod<T extends string>(method: HTTPMethod<T>) {
    this.#method = method;
    return this;
  }

  get method() {
    return this.#method;
  }

  setHost(host: string) {
    this._headers['Host'] = host;
    return this;
  }

  get host(): string | undefined {
    return this._headers['Host'];
  }

  setPath(path: string) {
    this.#path = path;
    return this;
  }

  get path() {
    return this.#path;
  }

  toString() {
    const header = dedent`
      ${this.#method} ${this.#path} ${this.protocol}
      ${Object.entries(this.headers).map(([k, v]) => `${k}: ${v}`).join('\n')}
    `;
    const formattedHeader = header.replaceAll('\n', NEWLINE) + NEWLINE + NEWLINE;
    return formattedHeader;
  }

  /**
   * @note headers are normalized
   */
  static parse(header: string): RequestHeader {
    const responseHeader = new RequestHeader();
    const lines = header.split(NEWLINE);
    const [method, path, protocol] = lines[0].split(' ');

    const headerLines = lines.slice(1);
    const headers: Headers = {};
    for (const header of headerLines) {
      const [key, value] = header.split(': ');
      headers[normalizeHeader(key)] = value;
    }

    responseHeader._protocol = protocol;
    responseHeader._headers = headers;
    responseHeader.#method = method;
    responseHeader.#path = path;

    return responseHeader;
  }
}

/**
 * @default protocol = 'HTTP/1.0'
 * @default statusCode = '200'
 * @default headers.Server = 'kaaaxSocket/1.0.0'
 * @default headers.Connection = 'close'
 */
export class ResponseHeader extends BaseHeader {
  #statusCode: keyof typeof StatusCodes = '200';

  constructor() {
    super();
    this._headers['Connection'] = 'close';
    this._headers['Server'] = 'kaaaxSocket/1.0.0';
  }

  setStatusCode(statusCode: keyof typeof StatusCodes) {
    this.#statusCode = statusCode;
    return this;
  }

  get statusCode() {
    return this.#statusCode;
  }

  toString() {
    const header = dedent`
      ${this.protocol} ${this.#statusCode} ${StatusCodes[this.#statusCode]}
      ${Object.entries(this.headers).map(([k, v]) => `${k}: ${v}`).join('\n')}
    `;
    const formattedHeader = header.replaceAll('\n', NEWLINE) + NEWLINE + NEWLINE;
    return formattedHeader;
  }

  /**
   * @note headers are normalized
   */
  static parse(header: string): ResponseHeader {
    const responseHeader = new ResponseHeader();
    const lines = header.split(NEWLINE);
    const [protocol, status] = lines[0].split(' ');
    const [statusCode] = status.split(' ');

    isValidStatusCode(statusCode);

    const headerLines = lines.slice(1);
    const headers: Headers = {};
    for (const header of headerLines) {
      const [key, value] = header.split(': ');
      headers[normalizeHeader(key)] = value;
    }

    responseHeader._protocol = protocol;
    responseHeader.#statusCode = statusCode;
    responseHeader._headers = headers;

    return responseHeader;
  }
}