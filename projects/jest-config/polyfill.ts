if (typeof globalThis.structuredClone !== 'function') {
    globalThis.structuredClone = (obj: unknown) => JSON.parse(JSON.stringify(obj));
}

/**
 * Should be here because
 * SyntaxError: Unexpected token 'export'
 * Jest encountered an unexpected token
 */
module.exports = {};
