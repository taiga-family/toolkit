import {AST_NODE_TYPES} from '@typescript-eslint/types';
import {ESLintUtils, type TSESTree} from '@typescript-eslint/utils';

import {getDecoratorMetadata} from './utils/get-decorator-metadata';
import {sameOrder} from './utils/same-order';

const DEFAULT_GROUP = '$DEFAULT';

const DEFAULT_ATTRIBUTE_GROUPS = [
    '$ANGULAR_STRUCTURAL_DIRECTIVE',
    '$ANGULAR_ELEMENT_REF',
    '$ID',
    '$DEFAULT',
    '$CLASS',
    '$ANGULAR_ANIMATION',
    '$ANGULAR_ANIMATION_INPUT',
    '$ANGULAR_INPUT',
    '$ANGULAR_TWO_WAY_BINDING',
    '$ANGULAR_OUTPUT',
] as const;

const DEFAULT_DECORATORS = ['Component', 'Directive'] as const;

const PRESETS: Record<string, RegExp | string[]> = {
    $ALT: /^alt$/,
    $ANGULAR: [
        '$CLASS',
        '$ID',
        '$ANGULAR_ELEMENT_REF',
        '$ANGULAR_STRUCTURAL_DIRECTIVE',
        '$ANGULAR_ANIMATION',
        '$ANGULAR_ANIMATION_INPUT',
        '$ANGULAR_TWO_WAY_BINDING',
        '$ANGULAR_INPUT',
        '$ANGULAR_OUTPUT',
    ],
    $ANGULAR_ANIMATION: /^@/,
    $ANGULAR_ANIMATION_INPUT: /^\[@/,
    $ANGULAR_ELEMENT_REF: /^#/,
    $ANGULAR_INPUT: /^\[[^(@]/,
    $ANGULAR_OUTPUT: /^\(/,
    $ANGULAR_STRUCTURAL_DIRECTIVE: /^\*/,
    $ANGULAR_TWO_WAY_BINDING: /^\[\(/,
    $ARIA: /^aria-/,
    $CLASS: /^class$/,
    $CODE_GUIDE: [
        '$CLASS',
        '$ID',
        '$NAME',
        '$DATA',
        '$SRC',
        '$FOR',
        '$TYPE',
        '$HREF',
        '$VALUE',
        '$TITLE',
        '$ALT',
        '$ROLE',
        '$ARIA',
    ],
    $DATA: /^data-/,
    $FOR: /^for$/,
    $HREF: /^href$/,
    $HTML: ['$CLASS', '$ID'],
    $ID: /^id$/,
    $NAME: /^name$/,
    $ROLE: /^role$/,
    $SRC: /^src$/,
    $TITLE: /^title$/,
    $TYPE: /^type$/,
    $VALUE: /^value$/,
    $VUE: ['$CLASS', '$ID', '$VUE_ATTRIBUTE'],
    $VUE_ATTRIBUTE: /^v-/,
};

type SortOrder = 'ASC' | 'DESC' | 'NONE';

type Options = [
    {
        attributeGroups?: string[];
        attributeIgnoreCase?: boolean;
        attributeSort?: SortOrder;
        decorators?: string[];
    },
];

type MessageIds = 'incorrectOrder';

interface HostAttributeProperty {
    readonly name: string;
    readonly node: TSESTree.Property;
}

interface Group<T> {
    readonly query: string;
    readonly regexp?: RegExp;
    readonly unknown?: boolean;
    readonly values: T[];
}

const createRule = ESLintUtils.RuleCreator((name) => name);

export const rule = createRule<Options, MessageIds>({
    create(context, [options]) {
        const sourceCode = context.sourceCode;
        const settings = {
            attributeGroups: [...DEFAULT_ATTRIBUTE_GROUPS],
            attributeIgnoreCase: true,
            attributeSort: 'ASC' as SortOrder,
            decorators: [...DEFAULT_DECORATORS],
            ...options,
        };
        const allowedDecorators = new Set(settings.decorators);

        return {
            ClassDeclaration(node?: TSESTree.ClassDeclaration) {
                for (const decorator of node?.decorators ?? []) {
                    const metadata = getDecoratorMetadata(decorator, allowedDecorators);

                    if (!metadata) {
                        continue;
                    }

                    const hostObject = getHostObject(metadata);

                    if (!hostObject) {
                        continue;
                    }

                    const properties = getHostAttributeProperties(hostObject);

                    if (!properties || properties.length <= 1) {
                        continue;
                    }

                    const sortedProperties = organizeProperties(properties, settings);
                    const currentOrder = properties.map(({name}) => name);
                    const expectedOrder = sortedProperties.map(({name}) => name);

                    if (sameOrder(currentOrder, expectedOrder)) {
                        continue;
                    }

                    const report = {
                        data: {expected: expectedOrder.join(', ')},
                        messageId: 'incorrectOrder' as const,
                        node: hostObject,
                    };

                    if (sourceCode.getCommentsInside(hostObject).length > 0) {
                        context.report(report);

                        continue;
                    }

                    context.report({
                        ...report,
                        fix: (fixer) =>
                            fixer.replaceTextRange(
                                hostObject.range,
                                `{${sortedProperties
                                    .map(({node: property}) =>
                                        sourceCode.getText(property),
                                    )
                                    .join(', ')}}`,
                            ),
                    });
                }
            },
        };
    },
    meta: {
        defaultOptions: [
            {
                attributeGroups: [...DEFAULT_ATTRIBUTE_GROUPS],
                attributeIgnoreCase: true,
                attributeSort: 'ASC',
                decorators: [...DEFAULT_DECORATORS],
            },
        ],
        docs: {
            description:
                'Sort Angular host metadata attributes using configurable attribute groups.',
        },
        fixable: 'code',
        messages: {incorrectOrder: 'Host attributes should be sorted as [{{expected}}]'},
        schema: [
            {
                additionalProperties: false,
                properties: {
                    attributeGroups: {
                        items: {type: 'string'},
                        type: 'array',
                    },
                    attributeIgnoreCase: {type: 'boolean'},
                    attributeSort: {
                        enum: ['ASC', 'DESC', 'NONE'],
                        type: 'string',
                    },
                    decorators: {
                        items: {type: 'string'},
                        type: 'array',
                    },
                },
                type: 'object',
            },
        ],
        type: 'problem',
    },
    name: 'host-attributes-sort',
});

function getHostObject(
    metadata: TSESTree.ObjectExpression,
): TSESTree.ObjectExpression | null {
    for (const property of metadata.properties) {
        if (
            property.type !== AST_NODE_TYPES.Property ||
            property.kind !== 'init' ||
            property.computed ||
            property.method ||
            getStaticPropertyName(property.key) !== 'host'
        ) {
            continue;
        }

        return property.value.type === AST_NODE_TYPES.ObjectExpression
            ? property.value
            : null;
    }

    return null;
}

function getHostAttributeProperties(
    hostObject: TSESTree.ObjectExpression,
): HostAttributeProperty[] | null {
    const properties: HostAttributeProperty[] = [];

    for (const property of hostObject.properties) {
        if (
            property.type !== AST_NODE_TYPES.Property ||
            property.kind !== 'init' ||
            property.computed ||
            property.method
        ) {
            return null;
        }

        const name = getStaticPropertyName(property.key);

        if (name === null) {
            return null;
        }

        properties.push({name, node: property});
    }

    return properties;
}

function getStaticPropertyName(key: TSESTree.PropertyName): string | null {
    if (key.type === AST_NODE_TYPES.Identifier) {
        return key.name;
    }

    if (
        key.type === AST_NODE_TYPES.Literal &&
        (typeof key.value === 'string' || typeof key.value === 'number')
    ) {
        return String(key.value);
    }

    if (
        key.type === AST_NODE_TYPES.TemplateLiteral &&
        key.expressions.length === 0 &&
        key.quasis.length === 1
    ) {
        return key.quasis[0]?.value.cooked ?? null;
    }

    return null;
}

function organizeProperties(
    properties: HostAttributeProperty[],
    options: {
        attributeGroups: string[];
        attributeIgnoreCase: boolean;
        attributeSort: SortOrder;
    },
): HostAttributeProperty[] {
    const groups = getGroups(
        options.attributeGroups.length > 0 ? options.attributeGroups : ['$ANGULAR'],
        options.attributeIgnoreCase,
    );
    const defaultGroup = ensureDefaultGroup(groups);

    for (const property of properties) {
        const targetGroup =
            groups.find(({regexp}) => regexp?.test(property.name)) ?? defaultGroup;

        targetGroup.values.push(property);
    }

    if (options.attributeSort !== 'NONE') {
        for (const group of groups) {
            group.values.sort((left, right) => left.name.localeCompare(right.name));

            if (options.attributeSort === 'DESC') {
                group.values.reverse();
            }
        }
    }

    return groups.flatMap(({values}) => values);
}

function getGroups(
    queries: string[],
    ignoreCase: boolean,
): Array<Group<HostAttributeProperty>> {
    return queries.flatMap((query) => getGroup(query, ignoreCase));
}

function getGroup(
    query: string,
    ignoreCase: boolean,
): Array<Group<HostAttributeProperty>> {
    if (query === DEFAULT_GROUP) {
        return [createDefaultGroup()];
    }

    const preset = PRESETS[query];

    if (!preset) {
        return [
            {
                query,
                regexp: new RegExp(query, ignoreCase ? 'i' : ''),
                values: [],
            },
        ];
    }

    if (Array.isArray(preset)) {
        return preset.flatMap((item) => getGroup(item, ignoreCase));
    }

    return [{query, regexp: preset, values: []}];
}

function ensureDefaultGroup(
    groups: Array<Group<HostAttributeProperty>>,
): Group<HostAttributeProperty> {
    const existing = groups.find(({unknown}) => unknown);

    if (existing) {
        return existing;
    }

    const fallback = createDefaultGroup();

    groups.push(fallback);

    return fallback;
}

function createDefaultGroup(): Group<HostAttributeProperty> {
    return {
        query: DEFAULT_GROUP,
        unknown: true,
        values: [],
    };
}

export default rule;
