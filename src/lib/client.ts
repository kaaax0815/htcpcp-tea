import { assert, HTTPMethod, safe, Headers } from './shared.js';
import { RequestHeader, ResponseHeader } from './header.js';
import Request from './request.js';
import { NEWLINE, StatusCodes } from './constants.js';
import { concatUint8Arrays, stringToUint8Array, uint8ArrayToString } from 'uint8array-extras';

export interface Options<Method extends string> {
  headers: Headers,
  method: HTTPMethod<Method>,
  body: string | null,
  timeout?: number,
  protocol?: string
}

export interface RequestResponse {
  headers: Headers,
  protocol: string,
  statusCode: keyof typeof StatusCodes,
  isJson: () => boolean,
  body: string
}

/**
 * @param url 
 * @default options.protocol = 'HTTP/1.0'
 * @default headers.headers.User-Agent = 'kaaaxSocket/1.0.0'
 * @default headers.headers.Connection = 'close'
 * @default options.timeout = 1000
 * @returns 
 */
export default async function request<Method extends string>(url: string, options: Options<Method>): Promise<RequestResponse> {
  const _url = safe(() => new URL(url));
  assert(_url.success, 'The URL you provided is invalid', 'Cant convert to node:URL');
  const { data: parsedUrl } = _url;

  const requestHeader = new RequestHeader().setHost(parsedUrl.host).setMethod(options.method).setPath(parsedUrl.pathname);
  if (options.protocol !== undefined) {
    requestHeader.setProtocol(options.protocol);
  }
  for (const [key, value] of Object.entries(options.headers)) {
    requestHeader.addHeader(key, value);
  }

  const port = Number.parseInt(parsedUrl.port || '80');
  assert(!Number.isNaN(port), 'Port is invalid', 'Port is not a number');

  const requestBody = safe(() => options.body === null ? null : stringToUint8Array(options.body));
  assert(requestBody.success, 'Body could not be converted to a Uint8Array');

  if (requestBody.data !== null && requestHeader.getHeader('Content-Length') === undefined) {
    requestHeader.addHeader('Content-Length', (requestBody.data.byteLength + 20).toString());
  }

  const parts: Uint8Array[] = [];
  parts.push(stringToUint8Array(requestHeader.toString()));
  if (requestBody.data !== null) { parts.push(requestBody.data); }
  const requestData = concatUint8Arrays(parts);

  const request = new Request(parsedUrl.hostname, port, requestData);
  const response = await request.execute(options.timeout);

  if (response === null) {
    throw new Error('No data received', { cause: 'The Server didn\'t send any data' });
  }

  const [header, body] = uint8ArrayToString(response).split(NEWLINE + NEWLINE);

  const responseHeader = ResponseHeader.parse(header);

  function isJson() {
    const contentType = responseHeader.getHeader('Content-Type');
    if (contentType === undefined) {
      return false;
    }
    const [mediaType] = contentType.split('; ');
    if (mediaType === 'application/json') {
      return true;
    }
    return false;
  }

  return { headers: responseHeader.headers, protocol: responseHeader.protocol, statusCode: responseHeader.statusCode, isJson, body };
}