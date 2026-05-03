import {AST_NODE_TYPES} from '@typescript-eslint/types';
import {type TSESLint, type TSESTree} from '@typescript-eslint/utils';

import {getDecoratorMetadata} from '../utils/angular/get-decorator-metadata';
import {getStaticPropertyName} from '../utils/ast/property-names';
import {sameOrder} from '../utils/collections/same-order';
import {createRule} from '../utils/create-rule';

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

interface AttachedComments {
    readonly leading: TSESTree.Comment[];
    readonly trailing: TSESTree.Comment | null;
}

interface Group<T> {
    readonly query: string;
    readonly regexp?: RegExp;
    readonly unknown?: boolean;
    readonly values: T[];
}

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

                    const fixText = getFixText(
                        hostObject,
                        properties,
                        sortedProperties,
                        sourceCode,
                    );

                    if (!fixText) {
                        context.report(report);

                        continue;
                    }

                    context.report({
                        ...report,
                        fix: (fixer) => fixer.replaceTextRange(hostObject.range, fixText),
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

function getFixText(
    hostObject: TSESTree.ObjectExpression,
    properties: HostAttributeProperty[],
    sortedProperties: HostAttributeProperty[],
    sourceCode: Readonly<TSESLint.SourceCode>,
): string | null {
    const comments = sourceCode.getCommentsInside(hostObject);

    if (comments.length === 0) {
        return `{${sortedProperties
            .map(({node: property}) => sourceCode.getText(property))
            .join(', ')}}`;
    }

    const attachedComments = getAttachedComments(
        hostObject,
        properties,
        sourceCode,
        comments,
    );

    if (!attachedComments) {
        return null;
    }

    return renderFixWithComments(
        hostObject,
        sortedProperties,
        sourceCode,
        attachedComments,
    );
}

function getAttachedComments(
    hostObject: TSESTree.ObjectExpression,
    properties: HostAttributeProperty[],
    sourceCode: Readonly<TSESLint.SourceCode>,
    comments: TSESTree.Comment[],
): Map<TSESTree.Property, AttachedComments> | null {
    const attached = new Map<TSESTree.Property, AttachedComments>();
    const usedComments = new Set<string>();

    for (const [index, {node}] of properties.entries()) {
        const previousProperty = properties[index - 1]?.node ?? null;
        const nextProperty = properties[index + 1]?.node ?? null;

        const leading = sourceCode
            .getCommentsBefore(node)
            .filter((comment) =>
                isAttachedLeadingComment(hostObject, previousProperty, node, comment),
            );

        const trailing = comments.find((comment) =>
            isAttachedTrailingComment(hostObject, node, nextProperty, comment),
        );

        for (const comment of leading) {
            usedComments.add(getCommentKey(comment));
        }

        if (trailing) {
            usedComments.add(getCommentKey(trailing));
        }

        attached.set(node, {leading, trailing: trailing ?? null});
    }

    return usedComments.size === comments.length ? attached : null;
}

function renderFixWithComments(
    hostObject: TSESTree.ObjectExpression,
    sortedProperties: HostAttributeProperty[],
    sourceCode: Readonly<TSESLint.SourceCode>,
    attachedComments: Map<TSESTree.Property, AttachedComments>,
): string {
    const objectIndentation = getLineIndentation(sourceCode.text, hostObject.range[0]);

    const propertyIndentation = getPropertyIndentation(
        hostObject,
        sortedProperties,
        sourceCode.text,
        attachedComments,
    );

    return `{\n${sortedProperties
        .map(({node}, index) =>
            renderPropertyWithComments(
                node,
                attachedComments.get(node),
                sourceCode,
                propertyIndentation,
                index === sortedProperties.length - 1,
            ),
        )
        .join('\n')}\n${objectIndentation}}`;
}

function renderPropertyWithComments(
    property: TSESTree.Property,
    attachedComments: AttachedComments | undefined,
    sourceCode: Readonly<TSESLint.SourceCode>,
    propertyIndentation: string,
    isLast: boolean,
): string {
    const lines =
        attachedComments?.leading.map(
            (comment) =>
                `${propertyIndentation}${sourceCode.text.slice(...comment.range)}`,
        ) ?? [];

    const trailingComment = attachedComments?.trailing
        ? ` ${sourceCode.text.slice(...attachedComments.trailing.range)}`
        : '';

    lines.push(
        `${propertyIndentation}${sourceCode.getText(property)}${isLast ? '' : ','}${trailingComment}`,
    );

    return lines.join('\n');
}

function getPropertyIndentation(
    hostObject: TSESTree.ObjectExpression,
    properties: HostAttributeProperty[],
    sourceText: string,
    attachedComments: Map<TSESTree.Property, AttachedComments>,
): string {
    for (const {node} of properties) {
        const comment = attachedComments.get(node)?.leading[0];
        const offset = comment?.range[0] ?? node.range[0];

        if (
            (comment?.loc.start.line ?? node.loc.start.line) > hostObject.loc.start.line
        ) {
            return getLineIndentation(sourceText, offset);
        }
    }

    return `${getLineIndentation(sourceText, hostObject.range[0])}    `;
}

function getLineIndentation(sourceText: string, offset: number): string {
    let lineStart = offset;

    while (
        lineStart > 0 &&
        sourceText[lineStart - 1] !== '\n' &&
        sourceText[lineStart - 1] !== '\r'
    ) {
        lineStart--;
    }

    let indentationEnd = lineStart;

    while (
        indentationEnd < sourceText.length &&
        (sourceText[indentationEnd] === ' ' || sourceText[indentationEnd] === '\t')
    ) {
        indentationEnd++;
    }

    return sourceText.slice(lineStart, indentationEnd);
}

function isAttachedLeadingComment(
    hostObject: TSESTree.ObjectExpression,
    previousProperty: TSESTree.Property | null,
    property: TSESTree.Property,
    comment: TSESTree.Comment,
): boolean {
    return (
        comment.range[0] >= hostObject.range[0] &&
        comment.range[1] <= property.range[0] &&
        (!previousProperty || comment.range[0] >= previousProperty.range[1]) &&
        comment.loc.start.line !== previousProperty?.loc.end.line
    );
}

function isAttachedTrailingComment(
    hostObject: TSESTree.ObjectExpression,
    property: TSESTree.Property,
    nextProperty: TSESTree.Property | null,
    comment: TSESTree.Comment,
): boolean {
    return (
        comment.range[0] >= property.range[1] &&
        comment.range[1] <= (nextProperty?.range[0] ?? hostObject.range[1]) &&
        comment.loc.start.line === property.loc.end.line
    );
}

function getCommentKey(comment: TSESTree.Comment): string {
    return `${comment.range[0]}:${comment.range[1]}`;
}
