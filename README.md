# HTCPCP-TEA

## Implementation of [RFC 2324](https://datatracker.ietf.org/doc/html/rfc2324) and [RFC 7168](https://datatracker.ietf.org/doc/html/rfc7168) in Typescript

### Components

- Socket based HTTP/1.0 Client & Server based on [RFC 1945](https://datatracker.ietf.org/doc/html/rfc1945) to support custom [HTCPCP Protocol](https://datatracker.ietf.org/doc/html/rfc2324#section-2)

### Compatibility

- Server and Client are not fully HTTP/1.0 compatible. But enough to support HTCPCP-TEA applications

### Security

- No Security Features / safeguards are implemented
- If a server uses any unsupported features it will probably just crash or result in weird behavior
- Should be used with TypeScript, as many validations are only on the type level, to allow complete freedom if needed

### Example

#### HTTP/1.0 Server

Server

```js
import { Router, Server, json } from "htcpcp-tea/lib";

const HOST = '127.0.0.1';
const PORT = 1234;

const router = new Router();
router.addRoute('GET', '/', () => {
  return json({ test: 10 });
}, 'HTTP/1.0')

Server(router).listen(PORT, () => {
  console.log(`Listening on ${HOST}:${PORT}`);
});
```

Client

```js
import { requestJson } from "htcpcp-tea/lib"

requestJson('http://localhost:1234', {
  body: {},
  method: 'GET',
  timeout: 100000
}).then((v) => {
  console.log(v.headers)
  if (v.isJson()) {
    console.log(JSON.parse(v.body))
  } else {
    console.log(v.body)
  }
}).catch((v) => console.error(v))
```
