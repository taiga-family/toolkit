module.exports = {
    plugins: [
        'stylelint-order',
        'stylelint-rem-over-px',
        'stylelint-use-logical',
        '@stylistic/stylelint-plugin',
    ],
    extends: ['@stylistic/stylelint-config'],
    $schema:
        'https://raw.githubusercontent.com/SchemaStore/schemastore/master/src/schemas/json/stylelintrc.json',
    allowEmptyInput: true,
    customSyntax: 'postcss-less',
    defaultSeverity: 'error',
    ignoreFiles: [
        `${process.cwd()}/**/dist/**`,
        `${process.cwd()}/**/coverage/**`,
        `${process.cwd()}/**/node_modules/**`,
        `${process.cwd()}/**/tests-report/**`,
    ],
    rules: {
        'color-no-invalid-hex': true,
        'comment-whitespace-inside': 'always',
        'declaration-block-no-shorthand-property-overrides': true,
        'named-grid-areas-no-invalid': true,
        'no-invalid-double-slash-comments': true,
        'no-invalid-position-at-import-rule': null,
        'selector-max-id': null,
        '@stylistic/declaration-block-trailing-semicolon': null,
        '@stylistic/declaration-colon-newline-after': null,
        '@stylistic/declaration-colon-space-after': null,
        '@stylistic/indentation': null,
        '@stylistic/max-line-length': null,
        '@stylistic/no-extra-semicolons': null,
        '@stylistic/selector-descendant-combinator-no-non-space': null,
        '@stylistic/string-quotes': 'single',
        '@stylistic/value-list-comma-newline-after': null,
        'alpha-value-notation': 'number',
        'annotation-no-unknown': true,
        'at-rule-allowed-list': [
            'extend',
            'keyframes',
            'import',
            'media',
            'supports',
            'font-face',
        ],
        'at-rule-empty-line-before': [
            'always',
            {
                except: ['first-nested'],
                ignore: ['after-comment', 'blockless-after-same-name-blockless'],
            },
        ],
        'at-rule-no-unknown': true,
        'at-rule-no-vendor-prefix': true,
        'block-no-empty': true,
        'color-function-notation': [
            'legacy',
            {
                ignore: ['with-var-inside'],
            },
        ],
        'color-hex-alpha': 'never',
        'color-hex-length': 'short',
        'color-named': [
            'never',
            {
                ignoreProperties: ['mask', 'mask-image'],
            },
        ],
        'comment-no-empty': true,
        'csstools/use-logical': [
            'always',
            {
                direction: 'ltr',
                except: [
                    /^margin/i,
                    /^padding/i,
                    /^border-/i,
                    'top',
                    'right',
                    'bottom',
                    'left',
                ],
            },
        ],
        'custom-property-empty-line-before': [
            'always',
            {
                except: ['after-custom-property', 'first-nested'],
                ignore: ['after-comment'],
            },
        ],
        'custom-property-no-missing-var-function': true,
        'declaration-block-no-duplicate-custom-properties': true,
        'declaration-block-no-duplicate-properties': [
            true,
            {
                ignore: ['consecutive-duplicates'],
            },
        ],
        'declaration-block-no-redundant-longhand-properties': [
            true,
            {
                ignoreShorthands: [
                    'inset',
                    'overflow',
                    'margin-inline',
                    'margin-block',
                    'padding-inline',
                    'padding-block',
                    'inset-inline',
                    'inset-block',
                ],
            },
        ],
        'declaration-empty-line-before': [
            'always',
            {
                except: ['first-nested', 'after-declaration'],
                ignore: ['after-comment'],
            },
        ],
        'declaration-no-important': null,
        'declaration-property-value-disallowed-list': null,
        'font-family-name-quotes': null,
        'font-family-no-duplicate-names': true,
        'font-family-no-missing-generic-family-keyword': true,
        'font-weight-notation': 'named-where-possible',
        'function-calc-no-unspaced-operator': true,
        'function-linear-gradient-no-nonstandard-direction': true,
        'function-name-case': 'lower',
        'function-no-unknown': [
            true,
            {
                ignoreFunctions: ['fade', 'lighten', 'darken'],
            },
        ],
        'function-url-no-scheme-relative': true,
        'function-url-quotes': 'always',
        'keyframe-block-no-duplicate-selectors': true,
        'keyframe-declaration-no-important': true,
        'length-zero-no-unit': [
            true,
            {
                ignore: ['custom-properties'],
            },
        ],
        'lightness-notation': 'percentage',
        'media-feature-name-no-unknown': true,
        'media-feature-name-no-vendor-prefix': null,
        'media-feature-name-value-no-unknown': true,
        'no-descending-specificity': null,
        'no-duplicate-selectors': true,
        'no-empty-source': true,
        'no-irregular-whitespace': true,
        'no-unknown-animations': null,
        'no-unknown-custom-media': true,
        'order/properties-order': [
            [
                'all',
                'content',
                'position',
                {
                    order: 'flexible',
                    properties: ['top', 'left', 'right', 'bottom'],
                },
                'z-index',
                'display',
            ],
            {
                unspecified: 'bottom',
            },
        ],
        'property-disallowed-list': [
            'width', // use inline-size
            'height', // use inline-size
            'min-width', // use min-inline-size
            'max-width', // use max-inline-size
            'min-height', // use min-block-size
            'max-height', // use max-block-size
            'margin-left', // use margin-inline-start
            'margin-right', // use margin-inline-end
            'margin-top', // use margin-block-start
            'margin-bottom', // use margin-block-end
            'padding-left', // use padding-inline-start
            'padding-right', // use padding-inline-end
            'padding-top', // use padding-block-start
            'padding-bottom', // use padding-block-end
            'border-left', // use border-inline-start
            'border-right', // use border-inline-end
            'border-top', // use border-block-start
            'border-bottom', // use border-block-end
            '/^word-wrap$/', // The word-wrap property was renamed to overflow-wrap in CSS3

            // TODO: turn on after release Taiga UI v5.0
            // 'left', // use inset-inline-start, Safari 14+
            // 'right', // use inset-inline-end, Safari 14+
            // 'top', // use inset-block-start, Safari 14+
            // 'bottom', // use inset-block-end, Safari 14+
            // 'scroll-margin-left', // use scroll-margin-inline-start
            // 'scroll-margin-right', // use scroll-margin-inline-end
            // 'scroll-margin-top', // use scroll-margin-block-start
            // 'scroll-margin-bottom', // use scroll-margin-block-end
            // 'scroll-padding-left', // use scroll-padding-inline-start
            // 'scroll-padding-right', // use scroll-padding-inline-end
            // 'scroll-padding-top', // use scroll-padding-block-start
            // 'scroll-padding-bottom', // use scroll-padding-block-end
            // 'border-top-left-radius', // use border-start-start-radius, Safari 15+
            // 'border-top-right-radius', // use border-start-end-radius, Safari 15+
            // 'border-bottom-left-radius', // use border-end-start-radius, Safari 15+
            // 'border-bottom-right-radius', // use border-end-end-radius, Safari 15+

            // TODO: drop after release Taiga UI v5.0
            'border-inline', // shorthand works in Safari 14+
            'padding-inline', // shorthand works in Safari 14+
            'margin-inline', // shorthand works in Safari 14+
        ],
        'property-no-unknown': [
            true,
            {
                ignoreProperties: ['interpolate-size'],
            },
        ],
        'property-no-vendor-prefix': null,
        'rem-over-px/rem-over-px': [
            true,
            {
                fontSize: 16,
                ignore: [
                    '-5px',
                    '-4px',
                    '-3px',
                    '-2px',
                    '-1px',
                    '0px',
                    '1px',
                    '2px',
                    '3px',
                    '4px',
                    '5px',
                    '16px',
                    '0.1px',
                    '0.2px',
                    '0.3px',
                    '0.4px',
                    '0.5px',
                    '0.6px',
                    '0.7px',
                    '0.8px',
                    '0.9px',
                ],
                ignoreAtRules: ['media'],
                ignoreFunctions: ['url'],
            },
        ],
        'rule-empty-line-before': [
            'always',
            {
                except: ['first-nested'],
                ignore: ['after-comment'],
            },
        ],
        'selector-anb-no-unmatchable': true,
        'selector-attribute-quotes': 'always',
        'selector-max-specificity': null,
        'selector-max-type': null,
        'selector-no-qualifying-type': null,
        'selector-no-vendor-prefix': true,
        'selector-pseudo-class-no-unknown': true,
        'selector-pseudo-element-colon-notation': 'double',
        'selector-pseudo-element-no-unknown': [
            true,
            {
                ignorePseudoElements: ['ng-deep'],
            },
        ],
        'selector-type-case': 'lower',
        'selector-type-no-unknown': [
            true,
            {
                ignoreTypes: [
                    /^app$/,
                    /^markdown$/,
                    '/^my-/',
                    '/^cdk-/',
                    '/^app-/',
                    '/^tui-/',
                ],
            },
        ],
        'shorthand-property-no-redundant-values': true,
        'string-no-newline': true,
        'time-min-milliseconds': null,
        'unit-allowed-list': [
            'px',
            'rem',
            'em',
            'deg',
            's',
            'ms',
            'dpcm',
            'turn',
            'ch',
            '%',
            'vh',
            'vw',
            'fr',
        ],
        'unit-no-unknown': true,
        'value-keyword-case': [
            'lower',
            {
                ignoreKeywords: ['currentColor', 'backgroundColor', 'optimizeLegibility'],
                ignoreProperties: ['/^--/', String.raw`/^\$/`],
            },
        ],
        'value-no-vendor-prefix': true,
        'no-duplicate-at-import-rules': true,
    },
};
