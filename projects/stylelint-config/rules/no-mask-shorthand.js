const valueParser = require('postcss-value-parser');
const stylelint = require('stylelint');

const {
    createPlugin,
    utils: {report, ruleMessages, validateOptions},
} = stylelint;

const ruleName = '@taiga-ui/no-mask-shorthand';
const messages = ruleMessages(ruleName, {
    expected: 'Expected "mask" shorthand to be expanded into longhand properties',
});

const meta = {
    fixable: true,
};

const cssWideKeywords = new Set([
    'inherit',
    'initial',
    'revert',
    'revert-layer',
    'unset',
]);
const geometryBoxes = new Set([
    'border-box',
    'content-box',
    'fill-box',
    'margin-box',
    'padding-box',
    'stroke-box',
    'view-box',
]);
const imageFunctions = new Set([
    '-webkit-gradient',
    'conic-gradient',
    'cross-fade',
    'element',
    'image',
    'image-set',
    'linear-gradient',
    'paint',
    'radial-gradient',
    'repeating-conic-gradient',
    'repeating-linear-gradient',
    'repeating-radial-gradient',
    'url',
]);
const positionSizeFunctions = new Set([
    'anchor',
    'anchor-size',
    'calc',
    'clamp',
    'env',
    'max',
    'min',
    'round',
]);
const maskModes = new Set(['alpha', 'luminance', 'match-source']);
const maskComposites = new Set(['add', 'exclude', 'intersect', 'subtract']);
const dimensionPattern = /^-?(?:\d+|\d*\.\d+)(?:%|[a-z]+)?$/i;
const positionKeywords = new Set([
    'block-end',
    'block-start',
    'bottom',
    'center',
    'end',
    'inline-end',
    'inline-start',
    'left',
    'right',
    'start',
    'top',
    'x-end',
    'x-start',
    'y-end',
    'y-start',
]);
const sizeKeywords = new Set(['auto', 'contain', 'cover']);
const repeatKeywords = new Set(['no-repeat', 'repeat', 'round', 'space']);
const singleRepeatKeywords = new Set([
    'repeat-block',
    'repeat-inline',
    'repeat-x',
    'repeat-y',
]);

const longhandDefinitions = [
    {always: true, initial: 'none', key: 'image', prop: 'mask-image'},
    {initial: 'repeat', key: 'repeat', prop: 'mask-repeat'},
    {initial: '0% 0%', key: 'position', prop: 'mask-position'},
    {initial: 'auto', key: 'size', prop: 'mask-size'},
    {initial: 'border-box', key: 'origin', prop: 'mask-origin'},
    {initial: 'border-box', key: 'clip', prop: 'mask-clip'},
    {initial: 'match-source', key: 'mode', prop: 'mask-mode'},
    {initial: 'add', key: 'composite', prop: 'mask-composite'},
];

const maskBorderResetDefinitions = [
    {prop: 'mask-border-source', value: 'none'},
    {prop: 'mask-border-mode', value: 'alpha'},
    {prop: 'mask-border-outset', value: '0'},
    {prop: 'mask-border-repeat', value: 'stretch'},
    {prop: 'mask-border-slice', value: '0'},
    {prop: 'mask-border-width', value: 'auto'},
];

function stringifyNodes(nodes) {
    return valueParser.stringify(nodes).trim();
}

function containsVar(nodes) {
    return nodes.some((node) => {
        if (node.type !== 'function') {
            return false;
        }

        if (node.value.toLowerCase() === 'var') {
            return true;
        }

        return containsVar(node.nodes);
    });
}

function splitLayers(nodes) {
    const layers = [];
    let current = [];

    for (const node of nodes) {
        if (node.type === 'div' && node.value === ',') {
            layers.push(current);
            current = [];
            continue;
        }

        current.push(node);
    }

    layers.push(current);

    return layers.filter((layer) => stringifyNodes(layer));
}

function pushTerm(terms, nodes) {
    if (nodes.length === 0) {
        return;
    }

    terms.push({
        lowerValue: stringifyNodes(nodes).toLowerCase(),
        nodes,
        value: stringifyNodes(nodes),
    });
}

function createTerms(nodes) {
    const terms = [];
    let current = [];

    for (const node of nodes) {
        if (node.type === 'comment') {
            return null;
        }

        if (node.type === 'space') {
            pushTerm(terms, current);
            current = [];
            continue;
        }

        if (node.type === 'div') {
            if (node.value !== '/') {
                return null;
            }

            pushTerm(terms, current);
            current = [];
            terms.push({type: 'slash'});
            continue;
        }

        current.push(node);
    }

    pushTerm(terms, current);

    return terms;
}

function getWord(term) {
    if (!term || term.type === 'slash' || term.nodes.length !== 1) {
        return null;
    }

    const [node] = term.nodes;

    return node.type === 'word' ? node.value.toLowerCase() : null;
}

function getFunctionName(term) {
    if (!term || term.type === 'slash' || term.nodes.length !== 1) {
        return null;
    }

    const [node] = term.nodes;

    return node.type === 'function' ? node.value.toLowerCase() : null;
}

function isImage(term) {
    const word = getWord(term);

    if (word === 'none' || word?.startsWith('@') || word?.startsWith('$')) {
        return true;
    }

    const functionName = getFunctionName(term);

    return Boolean(functionName && imageFunctions.has(functionName));
}

function isPreprocessorValue(word) {
    return word.startsWith('@') || word.startsWith('$') || word.startsWith('~');
}

function isPositionSizeFunction(term) {
    const functionName = getFunctionName(term);

    return Boolean(functionName && positionSizeFunctions.has(functionName));
}

function isPosition(term) {
    const word = getWord(term);

    if (word) {
        return (
            isPreprocessorValue(word) ||
            positionKeywords.has(word) ||
            dimensionPattern.test(word)
        );
    }

    return isPositionSizeFunction(term);
}

function isSize(term) {
    const word = getWord(term);

    if (word) {
        return (
            isPreprocessorValue(word) ||
            sizeKeywords.has(word) ||
            dimensionPattern.test(word)
        );
    }

    return isPositionSizeFunction(term);
}

function getRepeat(terms, index) {
    const word = getWord(terms[index]);

    if (!word) {
        return null;
    }

    if (singleRepeatKeywords.has(word)) {
        return {consumed: 1, value: word};
    }

    if (!repeatKeywords.has(word)) {
        return null;
    }

    const nextWord = getWord(terms[index + 1]);

    if (nextWord && repeatKeywords.has(nextWord)) {
        return {consumed: 2, value: `${word} ${nextWord}`};
    }

    return {consumed: 1, value: word};
}

function assignGeometry(layer, geometry) {
    if (geometry.length === 0) {
        return true;
    }

    const boxes = geometry.filter((value) => value !== 'no-clip');
    const clips = geometry.filter((value) => value === 'no-clip');
    const hasTooManyGeometryValues = boxes.length > 2 || clips.length > 1;

    if (hasTooManyGeometryValues) {
        return false;
    }

    if (clips.length > 0) {
        layer.clip = 'no-clip';

        if (boxes.length > 0) {
            layer.origin = boxes[0];
        }

        return true;
    }

    if (boxes.length === 1) {
        layer.clip = boxes[0];
        layer.origin = boxes[0];

        return true;
    }

    layer.origin = boxes[0];
    layer.clip = boxes[1];

    return true;
}

function assignValue(layer, key, value) {
    if (layer[key]) {
        return false;
    }

    layer[key] = value;

    return true;
}

function parseLayer(nodes) {
    const terms = createTerms(nodes);

    if (!terms) {
        return null;
    }

    const layer = {
        clip: null,
        composite: null,
        image: null,
        mode: null,
        origin: null,
        position: null,
        repeat: null,
        size: null,
    };
    const geometry = [];
    const position = [];
    const size = [];
    let isParsingSize = false;

    for (let index = 0; index < terms.length; index++) {
        const term = terms[index];

        if (term.type === 'slash') {
            if (isParsingSize) {
                return null;
            }

            isParsingSize = true;
            continue;
        }

        const word = getWord(term);

        if (word && maskModes.has(word)) {
            if (!assignValue(layer, 'mode', word)) {
                return null;
            }

            continue;
        }

        if (word && maskComposites.has(word)) {
            if (!assignValue(layer, 'composite', word)) {
                return null;
            }

            continue;
        }

        const repeat = getRepeat(terms, index);

        if (repeat) {
            if (!assignValue(layer, 'repeat', repeat.value)) {
                return null;
            }

            index += repeat.consumed - 1;
            continue;
        }

        if (word && (geometryBoxes.has(word) || word === 'no-clip')) {
            geometry.push(word);
            continue;
        }

        if (!isParsingSize && !layer.image && isImage(term)) {
            layer.image = term.value;
            continue;
        }

        if (isParsingSize) {
            if (!isSize(term)) {
                return null;
            }

            size.push(term.value);
        } else {
            if (!isPosition(term)) {
                return null;
            }

            position.push(term.value);
        }
    }

    if (!assignGeometry(layer, geometry)) {
        return null;
    }

    if (position.length > 0) {
        layer.position = position.join(' ');
    }

    if (size.length > 0) {
        layer.size = size.join(' ');
    }

    if (!layer.image) {
        layer.image = 'none';
    }

    return layer;
}

function isCssWideKeyword(value) {
    return cssWideKeywords.has(value.trim().toLowerCase());
}

function buildCssWideLonghands(value) {
    return longhandDefinitions.map(({prop}) => ({prop, value}));
}

function getLonghandValue(layers, definition) {
    const values = layers.map((layer) => layer[definition.key] || definition.initial);
    const hasSameValue = values.every((value) => value === values[0]);

    return hasSameValue ? values[0] : values.join(', ');
}

function buildLonghands(value) {
    if (isCssWideKeyword(value)) {
        return [...buildCssWideLonghands(value.trim()), ...maskBorderResetDefinitions];
    }

    const nodes = valueParser(value).nodes;

    if (containsVar(nodes)) {
        return null;
    }

    const layers = splitLayers(nodes).map(parseLayer);
    const hasUnparseableLayer = layers.some((layer) => !layer);

    if (hasUnparseableLayer || layers.length === 0) {
        return null;
    }

    return [
        ...longhandDefinitions.map((definition) => ({
            prop: definition.prop,
            value: getLonghandValue(layers, definition),
        })),
        ...maskBorderResetDefinitions,
    ];
}

function replaceDeclaration(decl, longhands) {
    for (const longhand of longhands) {
        decl.cloneBefore({
            important: decl.important,
            prop: longhand.prop,
            value: longhand.value,
        });
    }

    decl.remove();
}

/** @type {import('stylelint').Rule} */
const ruleFunction = (primary) => (root, result) => {
    const validOptions = validateOptions(result, ruleName, {
        actual: primary,
        possible: [true],
    });

    if (!validOptions) {
        return;
    }

    root.walkDecls('mask', (decl) => {
        const longhands = buildLonghands(decl.value);

        report({
            fix: longhands
                ? () => {
                      replaceDeclaration(decl, longhands);
                  }
                : undefined,
            message: messages.expected,
            node: decl,
            result,
            ruleName,
        });
    });
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = meta;

module.exports = createPlugin(ruleName, ruleFunction);
module.exports.ruleName = ruleName;
module.exports.messages = messages;
module.exports.meta = meta;
