const prettier = import('prettier');
const sortPackageJson = import('sort-package-json');
const {parsers} = require('prettier/parser-babel');
const {doc} = require('prettier');

const {join} = doc.builders;

const jsonStringifyParser = parsers['json-stringify'];

/**
 * Key order for `compilerOptions` in tsconfig files.
 * Keys listed here appear first (in this order); remaining keys are sorted alphabetically.
 */
const COMPILER_OPTIONS_KEY_ORDER = ['baseUrl', 'rootDir', 'strict'];

/**
 * Top-level key order for tsconfig files.
 * Keys listed here will appear first (in this order); remaining keys keep their original order.
 */
const TSCONFIG_KEY_ORDER = [
    '$schema',
    'extends',
    'compileOnSave',
    'compilerOptions',
    'angularCompilerOptions',
    'files',
    'include',
    'exclude',
    'references',
];

/**
 * Recursively sorts all plain-object keys alphabetically.
 * Arrays are traversed but their element order is preserved.
 *
 * @param {unknown} value
 * @returns {unknown}
 */
function sortAlphabetically(value) {
    if (Array.isArray(value)) {
        return value.map(sortAlphabetically);
    }

    if (typeof value === 'object' && value !== null) {
        /** @type {Record<string, unknown>} */
        const result = {};

        for (const key of Object.keys(value).sort()) {
            result[key] = sortAlphabetically(
                /** @type {Record<string, unknown>} */ value[key],
            );
        }

        return result;
    }

    return value;
}

/**
 * Reorders the top-level keys of a plain object according to `keyOrder`.
 * Keys not listed in `keyOrder` are appended afterward, sorted alphabetically.
 *
 * @param {Record<string, unknown>} obj
 * @param {string[]} keyOrder
 * @returns {Record<string, unknown>}
 */
function sortKeysByOrder(obj, keyOrder) {
    const result = /** @type {Record<string, unknown>} */ {};

    for (const key of keyOrder) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            result[key] = obj[key];
        }
    }

    for (const key of Object.keys(obj).sort()) {
        if (!Object.prototype.hasOwnProperty.call(result, key)) {
            result[key] = obj[key];
        }
    }

    return result;
}

exports.parsers = {
    'json-stringify': {
        ...jsonStringifyParser,
        /**
         * @param {string} text
         * @param {{ filepath: string | undefined; }} options
         */
        async parse(text, options) {
            const filepath = options.filepath ?? '';

            if (filepath.endsWith('package-lock.json')) {
                return jsonStringifyParser.parse(text, options);
            }

            // To avoid parsing errors
            text = await (await prettier).format(text, {filepath: options.filepath});

            if (jsonStringifyParser.preprocess) {
                text = jsonStringifyParser.preprocess(text, options);
            }

            const json = JSON.parse(text);
            let sorted;

            if (/tsconfig[^/\\]*\.json$/.test(filepath)) {
                // For tsconfig files use a dedicated key order instead of sort-package-json,
                // which treats unknown keys as package.json fields and orders them badly.
                sorted = sortKeysByOrder(json, TSCONFIG_KEY_ORDER);
            } else {
                const unsortedScripts = JSON.parse(JSON.stringify(json?.scripts || {}));

                sorted = (await sortPackageJson).default(json);

                /**
                 * @note: add the scripts field if it's provided
                 * the scripts must be unsorted
                 */
                if (
                    filepath.endsWith('package.json') &&
                    json?.hasOwnProperty('scripts')
                ) {
                    sorted.scripts = unsortedScripts;
                }
            }

            // Sort all nested objects alphabetically.
            // Top-level key order is already set above; here we only recurse into values.
            // `scripts` in package.json is intentionally left unsorted.
            for (const key of Object.keys(sorted)) {
                if (key === 'scripts' && filepath.endsWith('package.json')) {
                    continue;
                }

                if (typeof sorted[key] === 'object' && sorted[key] !== null) {
                    sorted[key] =
                        key === 'compilerOptions'
                            ? sortKeysByOrder(
                                  /** @type {Record<string, unknown>} */ sorted[key],
                                  COMPILER_OPTIONS_KEY_ORDER,
                              )
                            : sortAlphabetically(sorted[key]);
                }
            }

            text = JSON.stringify(sorted);

            return jsonStringifyParser.parse(text, options);
        },
    },
};

/**
 * Returns true for AST nodes that represent a primitive JSON value (string, number, boolean, null).
 *
 * @param {unknown} node
 * @returns {boolean}
 */
function isPrimitiveLiteral(node) {
    if (!node || typeof node !== 'object') {
        return false;
    }

    const {type} = /** @type {{type: string}} */ node;

    return (
        type === 'StringLiteral' ||
        type === 'NumericLiteral' ||
        type === 'BooleanLiteral' ||
        type === 'NullLiteral' ||
        // Fallback for parsers that produce generic `Literal` nodes
        (type === 'Literal' &&
            /** @type {{value: unknown}} */ node.value !==
                Object(/** @type {{value: unknown}} */ node.value))
    );
}

/**
 * Override the `estree-json` printer (used by both `json` and `json-stringify` parsers).
 * The only change: arrays with 1–2 primitive elements are kept on a single line.
 * Objects are always expanded by the original printer.
 */
let originalEstreeJsonPrinter;

try {
    originalEstreeJsonPrinter =
        /** @type {{printers: Record<string, import('prettier').Printer>}} */ require('prettier/plugins/estree')
            .printers?.['estree-json'];
} catch {}

if (originalEstreeJsonPrinter) {
    exports.printers = {
        'estree-json': {
            ...originalEstreeJsonPrinter,
            /**
             * @param {import('prettier').AstPath} path
             * @param {import('prettier').ParserOptions} options
             * @param {(path: import('prettier').AstPath) => import('prettier').Doc} print
             * @returns {import('prettier').Doc}
             */
            print(path, options, print) {
                const node = /** @type {{type: string; elements: unknown[]}} */ path.node;

                if (
                    !options.filepath?.endsWith('package.json') &&
                    node.type === 'ArrayExpression' &&
                    node.elements.length >= 1 &&
                    node.elements.length <= 2 &&
                    node.elements.every(isPrimitiveLiteral)
                ) {
                    const elements = /** @type {import('prettier').Doc[]} */ [];

                    path.each((p) => {
                        elements.push(print(p));
                    }, 'elements');

                    return ['[', join(', ', elements), ']'];
                }

                return originalEstreeJsonPrinter.print(path, options, print);
            },
        },
    };
}
