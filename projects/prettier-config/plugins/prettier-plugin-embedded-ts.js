const prettier = require('prettier');
const estreePlugin = require('prettier/plugins/estree');
const typescriptPlugin = require('prettier/plugins/typescript');

const {hardline, indent} = prettier.doc.builders;
const baseParser = typescriptPlugin.parsers.typescript;
const basePrinter = estreePlugin.printers.estree;

const EMBEDDED_PARSER = 'typescript';
const PARSER_NAME = 'typescript-embedded-ts';
const AST_FORMAT = 'estree-embedded-ts';

const MARKERS = new Set(['TS', 'TYPESCRIPT']);

const parsers = {
    [PARSER_NAME]: {
        ...baseParser,
        astFormat: AST_FORMAT,
        async parse(text, options) {
            const ast = await baseParser.parse(text, options);

            markEmbeddedTemplateLiterals(ast, text);

            return ast;
        },
    },
};

const printers = {
    [AST_FORMAT]: {
        ...basePrinter,
        embed(path, options) {
            const {node} = path;

            if (options.embeddedLanguageFormatting === 'off') {
                return basePrinter.embed?.(path, options);
            }

            if (
                node?.type === 'TemplateLiteral' &&
                node.__embeddedParser === EMBEDDED_PARSER &&
                node.expressions?.length === 0 &&
                node.quasis?.length === 1
            ) {
                return async (textToDoc) => {
                    const source = node.quasis[0].value.raw;
                    const doc = await textToDoc(source, {
                        ...options,
                        parser: EMBEDDED_PARSER,
                    });

                    return ['`', indent([hardline, doc]), hardline, '`'];
                };
            }

            return basePrinter.embed?.(path, options);
        },
    },
};

function markEmbeddedTemplateLiterals(ast, text) {
    const comments = collectComments(ast)
        .filter(isSupportedMarker)
        .sort((a, b) => getEnd(a) - getEnd(b));

    if (!comments.length) {
        return;
    }

    visit(ast, (node) => {
        if (
            node?.type !== 'TemplateLiteral' ||
            node.expressions?.length !== 0 ||
            node.quasis?.length !== 1
        ) {
            return;
        }

        const start = getStart(node);

        if (start == null) {
            return;
        }

        const marker = findDirectMarkerBefore(comments, start, text);

        if (marker) {
            node.__embeddedParser = EMBEDDED_PARSER;
        }
    });
}

function findDirectMarkerBefore(comments, nodeStart, text) {
    let candidate = null;

    for (const comment of comments) {
        const end = getEnd(comment);

        if (end == null || end > nodeStart) {
            continue;
        }

        const between = text.slice(end, nodeStart);

        if (/^\s*$/.test(between)) {
            candidate = comment;
        }
    }

    return candidate;
}

function isSupportedMarker(comment) {
    if (!comment || comment.type !== 'Block') {
        return false;
    }

    return MARKERS.has(comment.value.trim().toUpperCase());
}

function collectComments(ast) {
    const comments = [];
    const seen = new Set();

    const push = (comment) => {
        if (!comment || typeof comment !== 'object') {
            return;
        }

        const key = `${getStart(comment)}:${getEnd(comment)}:${comment.type}:${comment.value}`;

        if (seen.has(key)) {
            return;
        }

        seen.add(key);
        comments.push(comment);
    };

    if (Array.isArray(ast.comments)) {
        for (const comment of ast.comments) {
            push(comment);
        }
    }

    visit(ast, (node) => {
        if (Array.isArray(node.comments)) {
            for (const comment of node.comments) {
                push(comment);
            }
        }

        if (Array.isArray(node.leadingComments)) {
            for (const comment of node.leadingComments) {
                push(comment);
            }
        }

        if (Array.isArray(node.trailingComments)) {
            for (const comment of node.trailingComments) {
                push(comment);
            }
        }
    });

    return comments;
}

function visit(value, fn) {
    walk(value);

    function walk(node) {
        if (!node || typeof node !== 'object') {
            return;
        }

        if (Array.isArray(node)) {
            for (const item of node) {
                walk(item);
            }

            return;
        }

        fn(node);

        for (const [key, child] of Object.entries(node)) {
            if (
                key === 'loc' ||
                key === 'range' ||
                key === 'comments' ||
                key === 'leadingComments' ||
                key === 'trailingComments' ||
                key === 'parent'
            ) {
                continue;
            }

            walk(child);
        }
    }
}

function getStart(node) {
    return typeof node?.start === 'number' ? node.start : node?.range?.[0];
}

function getEnd(node) {
    return typeof node?.end === 'number' ? node.end : node?.range?.[1];
}

module.exports = {
    parsers,
    printers,
};
