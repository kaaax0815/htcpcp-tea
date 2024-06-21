import { requestJson } from 'htcpcp-tea/lib';

requestJson('http://localhost:1234/api/modules/warnings', {
  body: {},
  method: 'GET',
  timeout: 100000
}).then((v) => {
  console.log(v.headers);
  console.log(v.statusCode);
  if (v.isJson()) {
    console.log(JSON.parse(v.body));
  } else {
    console.log(v.body);
  }
}).catch((v) => console.error(v));