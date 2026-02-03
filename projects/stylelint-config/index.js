const {defaults: browserslist} = require('@taiga-ui/browserslist-config');

module.exports = {
    $schema:
        'https://raw.githubusercontent.com/SchemaStore/schemastore/master/src/schemas/json/stylelintrc.json',
    plugins: [
        'stylelint-order',
        'stylelint-rem-over-px',
        'stylelint-use-logical',
        'stylelint-plugin-logical-css',
        '@stylistic/stylelint-plugin',
        'stylelint-plugin-use-baseline',
        'stylelint-no-unsupported-browser-features',
    ],
    extends: ['@stylistic/stylelint-config'],
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
        '@stylistic/declaration-block-trailing-semicolon': null,
        '@stylistic/declaration-colon-newline-after': null,
        '@stylistic/declaration-colon-space-after': null,
        '@stylistic/indentation': null,
        '@stylistic/max-line-length': null,
        '@stylistic/no-extra-semicolons': null,
        '@stylistic/selector-descendant-combinator-no-non-space': null,
        '@stylistic/selector-pseudo-class-parentheses-space-inside': null,
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
            'property', // CSS Houdini
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
        'color-no-invalid-hex': true,
        'comment-no-empty': true,
        'comment-whitespace-inside': 'always',
        'csstools/use-logical': [
            'always',
            {
                direction: 'ltr',
                except: [
                    'float', // Safari 15+
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
        'declaration-block-no-shorthand-property-overrides': true,
        'declaration-empty-line-before': [
            'always',
            {
                except: ['first-nested', 'after-declaration'],
                ignore: ['after-comment'],
            },
        ],
        'declaration-no-important': null,
        'declaration-property-value-disallowed-list': {
            'inline-size': ['stretch'],
            width: ['stretch'],
        },
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
        'named-grid-areas-no-invalid': true,
        'no-descending-specificity': null,
        'no-duplicate-at-import-rules': true,
        'no-duplicate-selectors': true,
        'no-empty-source': true,
        'no-invalid-double-slash-comments': true,
        'no-invalid-position-at-import-rule': null,
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
        'plugin/no-unsupported-browser-features': [
            true,
            {
                browsers: browserslist,
                ignore: [
                    'css-nesting',
                    'css-resize',
                    'css-touch-action',
                    'css3-cursors',
                    'css-overscroll-behavior',
                    'css-scroll-behavior',
                    'css-focus-visible',
                    'css-selection',
                    'css-has',
                    'css-containment',
                    'css-nth-child-of',
                    'css3-cursors-grab',
                    'css-grid-animation',
                ],
                ignorePartialSupport: true,
            },
        ],
        'plugin/use-baseline': [
            true,
            {
                available: 2021, // Safari 14.5 was released by Apple in May 2021
                ignoreAtRules: ['view-transition', '/^font-/', '/^supports/'],
                ignoreFunctions: [
                    'color-mix', // Safari 16+
                    'rect', // Safari 17+
                ],
                ignoreProperties: {
                    '/^animation-/': ['/^.+$/'],
                    '/^mask-/': ['/^.+$/'],
                    '/^scroll-snap-/': ['/^.+$/'], // Safari 15+
                    'accent-color': ['/^.+$/'], // Safari NaN
                    appearance: ['/^.+$/'], // Safari 15+
                    'backdrop-filter': ['/^.+$/'],
                    'backface-visibility': ['/^.+$/'],
                    'box-decoration-break': ['/^.+$/'], // Safari NaN
                    clip: ['/^.+$/'],
                    'clip-path': ['/^.+$/'],
                    'color-scheme': ['/^.+$/'],
                    contain: ['/^.+$/'], // Safari 15+
                    hyphens: ['auto'],
                    'line-clamp': ['/^.+$/'],
                    mask: ['/^.+$/'],
                    'mix-blend-mode': ['/^.+$/'],
                    outline: ['/^.+$/'],
                    overflow: ['clip'], // Safari 16+
                    'overflow-clip-margin': ['/^.+$/'], // Safari NaN
                    'overflow-wrap': ['anywhere'], // Safari 15+
                    'overscroll-behavior': ['/^.+$/'], // Safari 16+
                    'overscroll-behavior-x': ['/^.+$/'], // Safari 16+
                    resize: ['/^.+$/'],
                    scale: ['/^.+$/'],
                    'scroll-behavior': ['/^.+$/'], // Safari 15+
                    'text-wrap': ['/^.+$/'], // Safari 17+
                    'user-select': ['none', 'auto'],
                    'word-break': ['break-word'],
                    'writing-mode': ['tb'],
                    zoom: ['/^.+$/'],
                },
                ignoreSelectors: [
                    'nesting',
                    'host-context',
                    'selection',
                    'has', // Safari 15.4+
                    'focus-visible', // Safari 15+
                    'fullscreen', // Safari 16+
                ],
            },
        ],
        'plugin/use-logical-properties-and-values': [
            true,
            {
                ignore: [
                    'scroll-margin-bottom', // Safari 15+
                    'scroll-margin-top', // Safari 15+
                    'scroll-margin-left', // Safari 15+
                    'scroll-margin-right', // Safari 15+
                    'scroll-padding-bottom', // Safari 15+
                    'scroll-padding-top', // Safari 15+
                    'scroll-padding-left', // Safari 15+
                    'scroll-padding-right', // Safari 15+
                    'border-bottom-left-radius', // Safari 15+ & Chrome 89+
                    'border-bottom-right-radius', // Safari 15+ & Chrome 89+
                    'border-top-left-radius', // Safari 15+ & Chrome 89+
                    'border-top-right-radius', // Safari 15+ & Chrome 89+
                    'clear', //  Safari 15+ & Chrome 118+
                    'float', //  Safari 15+ & Chrome 118+
                    'overscroll-behavior-x', // Safari 16+
                    'overscroll-behavior-y', // Safari 16+
                    'contain-intrinsic-height', //  Safari 17+ & Chrome 95+
                    'contain-intrinsic-width', //  Safari 17+ & Chrome 95+
                    'overflow-y', // Safari 26+ & Chrome 135+
                    'overflow-x', // Safari 26+ & Chrome 135+
                    'resize', // Chrome 118+ & Safari NaN+
                ],
            },
        ],
        'property-disallowed-list': [
            '/^word-wrap$/', // The word-wrap property was renamed to overflow-wrap in CSS3
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
                    '-2px',
                    '-1px',
                    '0.1px',
                    '0.2px',
                    '0.3px',
                    '0.4px',
                    '0.5px',
                    '0.6px',
                    '0.7px',
                    '0.8px',
                    '0.9px',
                    '1px',
                    '2px',
                    'font 16px',
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
        'selector-max-id': null,
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
                    '/^ng-/',
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
    },
};
