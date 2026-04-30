const postcss = require('prettier/plugins/postcss');

const AST_FORMAT = 'postcss-custom-properties';
const originalPostcssPrinter = postcss.printers.postcss;

/**
 * @param {unknown} node
 * @returns {node is {type: string; prop: string; value: string}}
 */
function isCustomPropertyDeclaration(node) {
    return (
        typeof node === 'object' &&
        node !== null &&
        'type' in node &&
        'prop' in node &&
        node.type === 'css-decl' &&
        typeof node.prop === 'string' &&
        node.prop.startsWith('--')
    );
}

/**
 * Returns true when a Prettier doc contains comment text (`//` or `/*`).
 * Checking the printed doc is more reliable than checking `node.value` because
 * postcss may store inline comments in `node.raws` rather than `node.value`.
 *
 * @param {import('prettier').Doc} doc
 * @returns {boolean}
 */
function docContainsComment(doc) {
    if (typeof doc === 'string') {
        return doc.includes('//') || doc.includes('/*');
    }

    if (Array.isArray(doc)) {
        return doc.some(docContainsComment);
    }

    if (typeof doc !== 'object' || doc === null) {
        return false;
    }

    if (doc.type === 'fill') {
        return doc.parts.some(docContainsComment);
    }

    if (doc.type === 'if-break') {
        return (
            docContainsComment(doc.breakContents) || docContainsComment(doc.flatContents)
        );
    }

    if ('contents' in doc) {
        return docContainsComment(doc.contents);
    }

    return false;
}

/**
 * Converts a Prettier doc to its flat representation so custom properties are
 * not wrapped by printWidth.
 *
 * @param {import('prettier').Doc} doc
 * @returns {import('prettier').Doc}
 */
function flattenDoc(doc) {
    if (typeof doc === 'string') {
        return doc;
    }

    if (Array.isArray(doc)) {
        return doc.map(flattenDoc);
    }

    switch (doc.type) {
        case 'align':
            return flattenDoc(doc.contents);

        case 'break-parent':
        case 'cursor':
            return '';

        case 'fill':
            return doc.parts.map(flattenDoc);

        case 'group':
            return flattenDoc(doc.contents);

        case 'if-break':
            return flattenDoc(doc.flatContents);

        case 'indent':
            return flattenDoc(doc.contents);

        case 'indent-if-break':
            return '';

        case 'label':
            return flattenDoc(doc.contents);

        case 'line':
            return doc.soft ? '' : ' ';

        case 'line-suffix':
            return flattenDoc(doc.contents);

        case 'line-suffix-boundary':
        case 'trim':
            return '';

        default:
            return doc;
    }
}

exports.printers = {
    [AST_FORMAT]: {
        ...originalPostcssPrinter,
        /**
         * @param {import('prettier').AstPath} path
         * @param {import('prettier').ParserOptions} options
         * @param {(path: import('prettier').AstPath) => import('prettier').Doc} print
         * @returns {import('prettier').Doc}
         */
        print(path, options, print) {
            const printed = originalPostcssPrinter.print(path, options, print);

            if (!isCustomPropertyDeclaration(path.node)) {
                return printed;
            }

            return docContainsComment(printed) ? printed : flattenDoc(printed);
        },
    },
};

exports.parsers = Object.fromEntries(
    Object.entries(postcss.parsers).map(([name, parser]) => [
        name,
        {
            ...parser,
            astFormat: AST_FORMAT,
        },
    ]),
);
