import { createConnection } from 'net';
import { concatUint8Arrays } from 'uint8array-extras';

export default class Request {
  #array: Uint8Array;
  #port: number;
  #host: string;

  constructor(host: string, port: number, array: Uint8Array) {
    this.#port = port;
    this.#host = host;
    this.#array = array;
  }

  /**
   * @default timeout = 1000
   */
  execute(timeout = 1000) {
    const socket = createConnection({
      port: this.#port,
      host: this.#host
    });
    socket.setTimeout(timeout);
    return new Promise<Uint8Array | null>((resolve, reject) => {
      let responseData: Uint8Array | null = null;
      socket.on('data', (data: Uint8Array) => {
        if (responseData === null) {
          responseData = data;
        } else {
          responseData = concatUint8Arrays([responseData, data]);
        }
      }).on('connect', () => {
        socket.write(this.#array);
      }).on('end', () => {
        resolve(responseData);
      }).on('timeout', () => {
        socket.destroy();
        reject(new Error('Destroyed'));
      }).on('error', (e) => {
        throw e;
      });
    });
  }
}