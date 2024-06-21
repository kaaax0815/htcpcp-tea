import { uint8ArrayToString } from 'uint8array-extras';
import { StatusCodes } from './constants.js';

export const DEFAULT_DECOMPRESSOR = { decompress: (input: Uint8Array) => uint8ArrayToString(input) } satisfies Decompressor;

export interface Decompressor {
  decompress(input: Uint8Array): string
}

type StandardHttpMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'PATCH';
type CustomHttpMethod<T = never> = T extends string ? T : never;

type NotUpperCase = string & { ['message']: 'Input has to by uppercase' };

export type HTTPMethod<T extends string> = T extends Uppercase<T> ? StandardHttpMethod | CustomHttpMethod<T> : NotUpperCase

/**
 * @description Normalizes Header to Format: Ulll-Ulll
 * 
 * First Letter is Uppercase, remaining are lowercase
 */
export function normalizeHeader(header: string): string {
  const normalizedKey = header.split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.substring(1).toLowerCase())
    .join('-');

  return normalizedKey.trim();
}

export function safe<T>(fn: () => T): { success: true, data: T } | { success: false, error: unknown } {
  try {
    return { success: true, data: fn() };
  } catch (e) {
    return { success: false, error: e };
  }
}

export function assert(v: boolean, message: string, cause: string | null = null): asserts v is true {
  if (v === false) {
    throw new Error(message, { cause: cause });
  }
}

export function isValidStatusCode(statusCode: string): asserts statusCode is keyof typeof StatusCodes {
  assert(statusCode in StatusCodes, 'Invalid Status Code', 'Server responded with invalid Status Code');
}

export type Headers = Record<string, string>

export function promisify<T>(inp: T) {
  return Promise.resolve(inp);
}