if (typeof globalThis.structuredClone !== 'function') {
    globalThis.structuredClone = (obj: unknown) => JSON.parse(JSON.stringify(obj));
}

if (typeof globalThis.setImmediate !== 'function') {
    globalThis.setImmediate = ((fn: (...args: unknown[]) => void, ...args: unknown[]) =>
        setTimeout(fn, 0, ...args)) as unknown as typeof globalThis.setImmediate;
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
