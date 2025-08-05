import type {TimerOptions} from 'node:timers';

if (typeof globalThis.structuredClone !== 'function') {
    globalThis.structuredClone = (obj: unknown) => JSON.parse(JSON.stringify(obj));
}

if (typeof globalThis.setImmediate !== 'function') {
    globalThis.setImmediate = (<T>(value?: T, options?: TimerOptions) =>
        setTimeout(() => value, 0, options)) as unknown as typeof globalThis.setImmediate;
}

if (typeof globalThis.clearImmediate !== 'function') {
    globalThis.clearImmediate = ((timeoutId: number | undefined) =>
        clearTimeout(timeoutId)) as unknown as typeof globalThis.clearImmediate;
}

/**
 * Should be here because
 * SyntaxError: Unexpected token 'export'
 * Jest encountered an unexpected token
 */
module.exports = {};
