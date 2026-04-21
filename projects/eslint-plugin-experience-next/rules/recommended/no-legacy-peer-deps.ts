import {createRule} from '../utils/create-rule';

type MessageId = 'noLegacyPeerDeps';

const LEGACY_PEER_DEPS_PATTERN = /^legacy-peer-deps\s*=\s*true$/i;

export const rule = createRule<[], MessageId>({
    create(context) {
        return {
            Program(node) {
                const text = context.sourceCode.getText(node);
                const lines = text.split('\n');

                for (const [index, line] of lines.entries()) {
                    const trimmed = line.trim();

                    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) {
                        continue;
                    }

                    if (LEGACY_PEER_DEPS_PATTERN.test(trimmed)) {
                        const startColumn = line.search(/\S/);

                        context.report({
                            loc: {
                                end: {column: line.length, line: index + 1},
                                start: {column: startColumn, line: index + 1},
                            },
                            messageId: 'noLegacyPeerDeps',
                        });
                    }
                }
            },
        };
    },
    meta: {
        docs: {
            description:
                'Disallow legacy-peer-deps=true in .npmrc. Fix peer dependency conflicts instead of bypassing them.',
        },
        messages: {
            noLegacyPeerDeps:
                'Do not use "legacy-peer-deps=true" in .npmrc. Fix peer dependency conflicts instead of bypassing the resolver.',
        },
        schema: [],
        type: 'problem',
    },
    name: 'no-legacy-peer-deps',
});

export default rule;
