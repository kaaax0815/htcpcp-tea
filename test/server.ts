import { Router, Server, json } from 'htcpcp-tea/lib';

const HOST = '127.0.0.1';
const PORT = 1234;

const router = new Router();
router.addRoute('GET', '/api/modules/warnings', () => {
  return json({ test: 10 });
}, 'HTTP/1.0');

Server(router).listen(PORT, () => {
  console.log(`Listening on ${HOST}:${PORT}`);
});
