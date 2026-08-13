import valueParser from 'postcss-value-parser';
import stylelint from 'stylelint';

type ValueNode = valueParser.Node;

type MaskLayerKey =
    'clip' | 'composite' | 'image' | 'mode' | 'origin' | 'position' | 'repeat' | 'size';

interface ValueTerm {
    readonly nodes: ValueNode[];
    readonly type: 'value';
    readonly value: string;
}

interface SlashTerm {
    readonly type: 'slash';
}

type Term = SlashTerm | ValueTerm;

type MaskLayer = Record<MaskLayerKey, string | null>;

interface LonghandDefinition {
    readonly always?: true;
    readonly initial: string;
    readonly key: MaskLayerKey;
    readonly prop: string;
}

interface LonghandDeclaration {
    readonly prop: string;
    readonly value: string;
}

interface ReplaceableDeclaration {
    readonly important: boolean;

    cloneBefore(overrides: LonghandDeclaration & {readonly important: boolean}): void;

    remove(): void;
}

interface RepeatMatch {
    readonly consumed: number;
    readonly value: string;
}

const {
    createPlugin,
    utils: {report, ruleMessages, validateOptions},
} = stylelint;

const ruleName = '@taiga-ui/no-mask-shorthand';

const messages = ruleMessages(ruleName, {
    expected: 'Expected "mask" shorthand to be expanded into longhand properties',
});

const meta: stylelint.RuleMeta = {
    fixable: true,
    url: 'https://github.com/taiga-family/toolkit/tree/main/projects/stylelint-config',
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

const longhandDefinitions: readonly LonghandDefinition[] = [
    {always: true, initial: 'none', key: 'image', prop: 'mask-image'},
    {initial: 'repeat', key: 'repeat', prop: 'mask-repeat'},
    {initial: '0% 0%', key: 'position', prop: 'mask-position'},
    {initial: 'auto', key: 'size', prop: 'mask-size'},
    {initial: 'border-box', key: 'origin', prop: 'mask-origin'},
    {initial: 'border-box', key: 'clip', prop: 'mask-clip'},
    {initial: 'match-source', key: 'mode', prop: 'mask-mode'},
    {initial: 'add', key: 'composite', prop: 'mask-composite'},
];

function stringifyNodes(nodes: ValueNode[]): string {
    return valueParser.stringify(nodes).trim();
}

function containsVar(nodes: readonly ValueNode[]): boolean {
    return nodes.some((node) => {
        if (node.type !== 'function') {
            return false;
        }

        return node.value.toLowerCase() === 'var' ? true : containsVar(node.nodes);
    });
}

function splitLayers(nodes: readonly ValueNode[]): ValueNode[][] {
    const layers: ValueNode[][] = [];
    let current: ValueNode[] = [];

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

function pushTerm(terms: Term[], nodes: ValueNode[]): void {
    if (nodes.length === 0) {
        return;
    }

    terms.push({
        nodes,
        type: 'value',
        value: stringifyNodes(nodes),
    });
}

function createTerms(nodes: readonly ValueNode[]): Term[] | null {
    const terms: Term[] = [];
    let current: ValueNode[] = [];

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

function getWord(term: Term | undefined): string | null {
    if (!term || term.type === 'slash' || term.nodes.length !== 1) {
        return null;
    }

    const node = term.nodes[0];

    return node?.type === 'word' ? node.value.toLowerCase() : null;
}

function getFunctionName(term: Term | undefined): string | null {
    if (!term || term.type === 'slash' || term.nodes.length !== 1) {
        return null;
    }

    const node = term.nodes[0];

    return node?.type === 'function' ? node.value.toLowerCase() : null;
}

function isImage(term: Term): boolean {
    const word = getWord(term);

    if (word === 'none' || word?.startsWith('@') || word?.startsWith('$')) {
        return true;
    }

    const functionName = getFunctionName(term);

    return Boolean(functionName && imageFunctions.has(functionName));
}

function isPreprocessorValue(word: string): boolean {
    return word.startsWith('@') || word.startsWith('$') || word.startsWith('~');
}

function isPositionSizeFunction(term: Term): boolean {
    const functionName = getFunctionName(term);

    return Boolean(functionName && positionSizeFunctions.has(functionName));
}

function isPosition(term: Term): boolean {
    const word = getWord(term);

    return word
        ? isPreprocessorValue(word) ||
              positionKeywords.has(word) ||
              dimensionPattern.test(word)
        : isPositionSizeFunction(term);
}

function isSize(term: Term): boolean {
    const word = getWord(term);

    return word
        ? isPreprocessorValue(word) ||
              sizeKeywords.has(word) ||
              dimensionPattern.test(word)
        : isPositionSizeFunction(term);
}

function getRepeat(terms: readonly Term[], index: number): RepeatMatch | null {
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

    return nextWord && repeatKeywords.has(nextWord)
        ? {consumed: 2, value: `${word} ${nextWord}`}
        : {consumed: 1, value: word};
}

function assignGeometry(layer: MaskLayer, geometry: readonly string[]): boolean {
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
            const origin = boxes[0];

            if (!origin) {
                return false;
            }

            layer.origin = origin;
        }

        return true;
    }

    if (boxes.length === 1) {
        const box = boxes[0];

        if (!box) {
            return false;
        }

        layer.clip = box;
        layer.origin = box;

        return true;
    }

    const origin = boxes[0];
    const clip = boxes[1];

    if (!origin || !clip) {
        return false;
    }

    layer.origin = origin;
    layer.clip = clip;

    return true;
}

function assignValue(layer: MaskLayer, key: MaskLayerKey, value: string): boolean {
    if (layer[key]) {
        return false;
    }

    layer[key] = value;

    return true;
}

function parseLayer(nodes: ValueNode[]): MaskLayer | null {
    const terms = createTerms(nodes);

    if (!terms) {
        return null;
    }

    const layer: MaskLayer = {
        clip: null,
        composite: null,
        image: null,
        mode: null,
        origin: null,
        position: null,
        repeat: null,
        size: null,
    };

    const geometry: string[] = [];
    const position: string[] = [];
    const size: string[] = [];
    let isParsingSize = false;

    for (let index = 0; index < terms.length; index++) {
        const term = terms[index];

        if (!term) {
            return null;
        }

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

function isCssWideKeyword(value: string): boolean {
    return cssWideKeywords.has(value.trim().toLowerCase());
}

function getLonghandValue(
    layers: readonly MaskLayer[],
    definition: LonghandDefinition,
): string {
    const values = layers.map((layer) => layer[definition.key] || definition.initial);
    const firstValue = values[0];

    if (firstValue === undefined) {
        return definition.initial;
    }

    const hasSameValue = values.every((value) => value === firstValue);

    return hasSameValue ? firstValue : values.join(', ');
}

function isMaskLayer(layer: MaskLayer | null): layer is MaskLayer {
    return layer !== null;
}

function hasExplicitLonghandValue(
    layers: readonly MaskLayer[],
    definition: LonghandDefinition,
): boolean {
    return definition.always === true || layers.some((layer) => layer[definition.key]);
}

function buildLonghands(value: string): LonghandDeclaration[] | null {
    if (isCssWideKeyword(value)) {
        return null;
    }

    const nodes = valueParser(value).nodes;

    if (containsVar(nodes)) {
        return null;
    }

    const parsedLayers = splitLayers(nodes).map(parseLayer);
    const hasUnparseableLayer = parsedLayers.some((layer) => !layer);

    if (hasUnparseableLayer || parsedLayers.length === 0) {
        return null;
    }

    const layers = parsedLayers.filter(isMaskLayer);

    return [
        ...longhandDefinitions
            .filter((definition) => hasExplicitLonghandValue(layers, definition))
            .map((definition) => ({
                prop: definition.prop,
                value: getLonghandValue(layers, definition),
            })),
    ];
}

function replaceDeclaration(
    decl: ReplaceableDeclaration,
    longhands: readonly LonghandDeclaration[],
): void {
    for (const longhand of longhands) {
        decl.cloneBefore({
            important: decl.important,
            prop: longhand.prop,
            value: longhand.value,
        });
    }

    decl.remove();
}

const ruleFunction: stylelint.Rule<boolean, Record<string, never>, typeof messages> =
    (primary) => (root, result) => {
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

const plugin = Object.assign(createPlugin(ruleName, ruleFunction), {
    messages,
    meta,
    ruleName,
});

export default plugin;
