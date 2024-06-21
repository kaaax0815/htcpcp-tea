import { StatusCodes } from './constants.js';
import { ResponseHeader } from './header.js';
import { RouteResponse } from './router.js';
import request from './client.js';
import { HTTPMethod, Headers } from './shared.js';

/**
 * @default statusCode = '200'
 */
export function json(obj: Record<string, unknown>, statusCode: keyof typeof StatusCodes = '200'): RouteResponse {
  return {
    header: new ResponseHeader().setStatusCode(statusCode).addHeader('Content-Type', 'application/json'),
    body: JSON.stringify(obj)
  };
}

export interface RequestOptions<T extends string> {
  body: Record<string, unknown>,
  headers?: Headers,
  method: HTTPMethod<T>,
  protocol?: string,
  timeout?: number
}

/**
 * Defaults see {@link request}
 */
export function requestJson<T extends string>(url: string, opts: RequestOptions<T>) {
  return request(url, {
    body: JSON.stringify(opts.body),
    headers: {
      ...opts.headers ?? {},
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    method: opts.method,
    protocol: opts.protocol,
    timeout: opts.timeout
  });
}