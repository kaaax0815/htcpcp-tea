import {AdditionType} from './shared.js';

export default abstract class Pot {
  #start: number | null = null;
  readonly types;
  readonly availableAdditions;

  constructor(types: string[], availableAdditions: AdditionType[]) {
    this.types = types;
    this.availableAdditions = availableAdditions;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  start(additions: AdditionType[]) {
    this.#start = Date.now();
  }

  stop() {
    if (this.#start === null) {
      throw new Error('Cant stop brewing', { cause: 'Brewing has not started' });
    }
    const end = Date.now();
    const time = end - this.#start;
    this.#start = null;
    return time;
  }

  brewing() {
    return this.#start !== null;
  }
}