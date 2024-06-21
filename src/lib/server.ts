import { createServer } from 'net';
import { concatUint8Arrays, stringToUint8Array, uint8ArrayToString } from 'uint8array-extras';
import { RequestHeader, ResponseHeader } from './header.js';
import { NEWLINE } from './constants.js';
import Router from './router.js';

export default function Server(router: Router) {
  const server = createServer((socket) => {
    socket.on('data', (data: Uint8Array) => {
      const start = performance.now();
      const [header, body] = uint8ArrayToString(data).split(NEWLINE + NEWLINE);

      const parsedHeader = RequestHeader.parse(header);
      const contentLength = Number.parseInt(parsedHeader.getHeader('Content-Length') ?? 'NaN');

      let parsedBody = null;
      if (!Number.isNaN(contentLength)) {
        const bytes = stringToUint8Array(body).slice(0, contentLength);
        parsedBody = uint8ArrayToString(bytes);
      }

      router._handleRoute(parsedHeader.method, parsedHeader.protocol, parsedHeader.path, parsedHeader.headers, parsedBody).then((response) => {
        const parts: Uint8Array[] = [];
        parts.push(stringToUint8Array(response.header.toString()));
        if (response.body !== null) { parts.push(response.body); }
        const responseData = concatUint8Arrays(parts);

        socket.write(responseData);

        const end = performance.now();
        console.log(`${parsedHeader.protocol} ${parsedHeader.method} ${parsedHeader.path} ${response.header.statusCode} ${response.body?.byteLength ?? 'Empty'} ${(end - start).toFixed(3)}ms`);

        socket.end();
      }).catch(() => {
        const response = { header: new ResponseHeader().setStatusCode('500').setProtocol(parsedHeader.protocol), body: null };
        const end = performance.now();
        console.log(`${parsedHeader.protocol} ${parsedHeader.method} ${parsedHeader.path} ${response.header.statusCode} Empty ${(end - start).toFixed(3)}ms`);

        socket.end();
      });
    });
  });
  return server;
}