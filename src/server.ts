import { ResponseHeader } from './lib/header.js';
import { Server as lServer, Router } from './lib/index.js';
import { HandlerParams, HandlerReturn } from './lib/router.js';
import Pot from './pot.js';
import { AdditionType } from './shared.js';

export default class Server {
  #server;
  #pots;

  constructor(pots: Pot[]) {
    this.#pots = pots;
    const router = new Router();
    router.addRoute('BREW', '/', this.#indexHandler);
    router.addRoute('BREW', '/pot-:id:/:type:', this.#brewHandler);
    router.addRoute('POST', '/pot-:id:/:type:', this.#brewHandler);
    this.#server = lServer(router);
  }

  get listen() {
    return this.#server.listen;
  }

  #indexHandler(): HandlerReturn {
    const responseHeader = new ResponseHeader().setProtocol('HTCPCP/1.0').setStatusCode('300').addHeader('Alternates', this.#buildAlternatesHeader());
    return { header: responseHeader, body: null };
  }

  #brewHandler({ headers, body, params }: HandlerParams): HandlerReturn {
    const id = Number.parseInt(params?.id ?? 'NaN');
    const type = params?.type ?? null;

    if (Number.isNaN(id) || type === null) {
      const responseHeader = new ResponseHeader().setProtocol('HTCPCP/1.0').setStatusCode('400');
      return { header: responseHeader, body: JSON.stringify({message: 'Invalid or missing param'}) };
    }

    const pot = this.#pots[id];

    if ((headers['Content-Type'] === 'message/coffeepot' && !pot.types.includes('coffee'))) {
      const responseHeader = new ResponseHeader().setProtocol('HTCPCP/1.0').setStatusCode('418');
      // eslint-disable-next-line quotes
      return { header: responseHeader, body: "I'm a teapot" };
    }

    if (!pot.types.includes(type)) {
      const responseHeader = new ResponseHeader().setProtocol('HTCPCP/1.0').setStatusCode('406');
      return { header: responseHeader, body: 'Invalid type' };
    }

    if (body === null && body !== 'start' && body !== 'stop') {
      const responseHeader = new ResponseHeader().setProtocol('HTCPCP/1.0').setStatusCode('400');
      return { header: responseHeader, body: 'Invalid body' };
    }

    const additions: AdditionType[] = [];
    if (headers['Accept-Additions'] !== undefined) {
      const headerAdditions = headers['Accept-Additions'].split(';');
      for (const headerAddition of headerAdditions) {
        if (AdditionType.includes(headerAddition as AdditionType)) {
          additions.push(headerAddition as AdditionType);
        }
      }
    }

    let message: string | null = null;
    if (body === 'start') {
      pot.start(additions);
      message = 'Started brewing';
    } else if (body === 'stop') {
      pot.stop();
      message = 'Stopped brewing';
    }

    const responseHeader = new ResponseHeader().setProtocol('HTCPCP/1.0').setStatusCode('200');

    return { header: responseHeader, body: message };
  }

  #buildAlternatesHeader() {
    const lines: string[] = ['{"/" {type message/coffeepot}}}'];
    for (const [i, pot] of this.#pots.entries()) {
      for (const type of pot.types) {
        const mime = type === 'coffee' ? 'message/coffeepot' : 'message/teapot';
        lines.push(`{"/pot-${i}/${type}" {type ${mime}}}`);
      }
    }
    return lines.join(', ');
  }
}
