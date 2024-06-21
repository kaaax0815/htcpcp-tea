import { stringToUint8Array } from 'uint8array-extras';
import { ResponseHeader } from './header.js';
import { HTTPMethod, Headers, promisify } from './shared.js';

export interface RouteResponse {
  header: ResponseHeader,
  body: string | null
}

export interface RouterResponse {
  header: ResponseHeader,
  body: Uint8Array | null
}
export interface HandlerParams {
  headers: Headers,
  body: string | null,
  params: Record<string, string> | null
}
export type HandlerReturn = ReturnType<Handler>;
export type Handler = (resp: HandlerParams) => Promise<RouteResponse> | RouteResponse;
type Protocol = string;
type Path = string;
type Method = string;

export default class Router {
  #routes: Record<Protocol, Record<Path, Record<Method, Handler>>> = {};

  /**
   * @default protocol = 'HTTP/1.0'
   * @param method catch all are `*`
   * @param path params are wrapped in `:` like `/api/:id:`
   */
  addRoute<Method extends string>(method: HTTPMethod<Method>, path: string, handler: Handler, protocol = 'HTTP/1.0') {
    if (this.#routes[protocol] === undefined) {
      this.#routes[protocol] = {};
    }
    if (this.#routes[protocol][path] === undefined) {
      this.#routes[protocol][path] = {};
    }
    this.#routes[protocol][path][method] = handler;
  }

  get routes() {
    return this.#routes;
  }

  /**
   * @internal
   */
  _handleRoute(method: Method, protocol: Protocol, path: Path, headers: Headers, body: string | null): Promise<RouterResponse> {
    if (this.#routes[protocol] === undefined) {
      return this.handleRouteResponse({ header: new ResponseHeader().setProtocol(protocol).setStatusCode('400'), body: null });
    }
    const parsedPath = this.matchRoute(this.#routes[protocol], path);
    if (parsedPath === null) {
      return this.handleRouteResponse({ header: new ResponseHeader().setProtocol(protocol).setStatusCode('404'), body: null });
    }
    const pathRoutes = this.#routes[protocol][parsedPath.path];
    if (pathRoutes[method] === undefined) {
      if (pathRoutes['*'] === undefined) {
        return this.handleRouteResponse({ header: new ResponseHeader().setProtocol(protocol).setStatusCode('405'), body: null });
      } else {
        return this.handleRouteResponse(pathRoutes['*']({ headers, body, params: parsedPath.params }));
      }
    } else {
      return this.handleRouteResponse(pathRoutes[method]({ headers, body, params: parsedPath.params }));
    }
  }

  protected async handleRouteResponse(response: Promise<RouteResponse> | RouteResponse) {
    const promise = promisify(response);
    const v = await promise;
    const body = v.body === null ? null : stringToUint8Array(v.body);
    if (v.header.getHeader('Content-Length') === undefined && body !== null) {
      v.header.addHeader('Content-Length', body.byteLength.toString());
    }
    return {
      header: v.header,
      body: body
    };
  }

  protected matchRoute(routes: Record<Path, unknown>, path: string) {
    const keys = Object.keys(routes);
    for (const key of keys) {
      const regex = new RegExp('^' + key.replace(/:\w+:/g, '(\\w+)') + '$');
      const match = path.match(regex);
      if (match !== null) {
        const paramNames = key.match(/:\w+:/g)?.map(param => param.slice(1, -1));
        const params = paramNames?.reduce((obj, paramName, index) => {
          obj[paramName] = match[index + 1];
          return obj;
        }, {} as Record<string, string>);
        return {
          path: key,
          params: params ?? null
        };
      }
    }
    return null;
  }
}