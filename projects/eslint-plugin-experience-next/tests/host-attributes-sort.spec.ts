import {rule} from '../rules/host-attributes-sort';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
        },
    },
});

ruleTester.run('host-attributes-sort', rule, {
    invalid: [
        {
            code: `
                @Component({
                    host: {
                        '(click)': 'handleClick()',
                        '[value]': 'value()',
                        '[@fade.start]': 'onFadeStart()',
                        '@fade': 'fade()',
                        class: 'cmp',
                        'aria-label': 'ariaLabel()',
                        id: 'cmp-id',
                        '[(model)]': 'model()'
                    }
                })
                class TestComponent {}
            `,
            errors: [
                {
                    message:
                        'Host attributes should be sorted as [id, aria-label, class, @fade, [@fade.start], [value], [(model)], (click)]',
                },
            ],
            output: `
                @Component({
                    host: {id: 'cmp-id', 'aria-label': 'ariaLabel()', class: 'cmp', '@fade': 'fade()', '[@fade.start]': 'onFadeStart()', '[value]': 'value()', '[(model)]': 'model()', '(click)': 'handleClick()'}
                })
                class TestComponent {}
            `,
        },
        {
            code: `
                @Directive({
                    host: {
                        title: 'title',
                        id: 'identifier',
                        class: 'klass'
                    }
                })
                class TestDirective {}
            `,
            errors: [{message: 'Host attributes should be sorted as [class, id, title]'}],
            options: [
                {
                    attributeGroups: ['$CLASS', '$ID', '$DEFAULT'],
                    decorators: ['Directive'],
                },
            ],
            output: `
                @Directive({
                    host: {class: 'klass', id: 'identifier', title: 'title'}
                })
                class TestDirective {}
            `,
        },
        {
            code: `
                @Directive({
                    host: {
                        '(click)': 'handleClick()',
                        '[value]': 'value()',
                        '[(value)]': 'value()',
                        '[@fade.start]': 'onFadeStart()',
                        '@fade': 'fade()',
                        '*defer': 'isReady()',
                        '#control': 'control',
                        id: 'cmp-id',
                        class: 'cmp'
                    }
                })
                class TestDirective {}
            `,
            errors: [
                {
                    message:
                        'Host attributes should be sorted as [class, id, #control, *defer, @fade, [@fade.start], [(value)], [value], (click)]',
                },
            ],
            options: [{attributeGroups: ['$ANGULAR'], decorators: ['Directive']}],
            output: `
                @Directive({
                    host: {class: 'cmp', id: 'cmp-id', '#control': 'control', '*defer': 'isReady()', '@fade': 'fade()', '[@fade.start]': 'onFadeStart()', '[(value)]': 'value()', '[value]': 'value()', '(click)': 'handleClick()'}
                })
                class TestDirective {}
            `,
        },
        {
            code: `
                @Component({
                    host: {
                        title: 'title',
                        role: 'button',
                        id: 'identifier',
                        class: 'klass'
                    }
                })
                class TestComponent {}
            `,
            errors: [
                {message: 'Host attributes should be sorted as [class, id, role, title]'},
            ],
            options: [{attributeGroups: ['$HTML']}],
            output: `
                @Component({
                    host: {class: 'klass', id: 'identifier', role: 'button', title: 'title'}
                })
                class TestComponent {}
            `,
        },
        {
            code: `
                @Directive({
                    host: {
                        title: 'title',
                        'data-test': 'test',
                        'aria-label': 'label',
                        href: '/docs',
                        id: 'identifier',
                        class: 'klass'
                    }
                })
                class TestDirective {}
            `,
            errors: [
                {
                    message:
                        'Host attributes should be sorted as [class, id, data-test, href, title, aria-label]',
                },
            ],
            options: [{attributeGroups: ['$CODE_GUIDE'], decorators: ['Directive']}],
            output: `
                @Directive({
                    host: {class: 'klass', id: 'identifier', 'data-test': 'test', href: '/docs', title: 'title', 'aria-label': 'label'}
                })
                class TestDirective {}
            `,
        },
        {
            code: `
                @Component({
                    host: {
                        '[style.--tui-ticks-gradient]': 'ticksGradient()',
                        /**
                         * For change detection.
                         */
                        '(input)': '0',
                        '[style.--tui-slider-fill-ratio]': 'valueRatio'
                    }
                })
                class TestComponent {}
            `,
            errors: [
                {
                    message:
                        'Host attributes should be sorted as [[style.--tui-slider-fill-ratio], [style.--tui-ticks-gradient], (input)]',
                },
            ],
            output: `
                @Component({
                    host: {
                        '[style.--tui-slider-fill-ratio]': 'valueRatio',
                        '[style.--tui-ticks-gradient]': 'ticksGradient()',
                        /**
                         * For change detection.
                         */
                        '(input)': '0'
                    }
                })
                class TestComponent {}
            `,
        },
        {
            code: `
                @Component({
                    host: {
                        '(mousedown)': 'prevent($event)',
                        // Hide Android text select handle
                        '[class._mobile]': 'isMobile',
                        '(scroll.zoneless)': 'onScroll()'
                    }
                })
                class TestComponent {}
            `,
            errors: [
                {
                    message:
                        'Host attributes should be sorted as [[class._mobile], (mousedown), (scroll.zoneless)]',
                },
            ],
            output: `
                @Component({
                    host: {
                        // Hide Android text select handle
                        '[class._mobile]': 'isMobile',
                        '(mousedown)': 'prevent($event)',
                        '(scroll.zoneless)': 'onScroll()'
                    }
                })
                class TestComponent {}
            `,
        },
        {
            code: `
                @Component({
                    host: {
                        '(mousedown)': 'prevent($event)', // Hide Android text select handle
                        '[class._mobile]': 'isMobile'
                    }
                })
                class TestComponent {}
            `,
            errors: [
                {
                    message:
                        'Host attributes should be sorted as [[class._mobile], (mousedown)]',
                },
            ],
            output: `
                @Component({
                    host: {
                        '[class._mobile]': 'isMobile',
                        '(mousedown)': 'prevent($event)' // Hide Android text select handle
                    }
                })
                class TestComponent {}
            `,
        },
    ],
    valid: [
        {
            code: `
                @Component({
                    selector: 'app-test'
                })
                class TestComponent {}
            `,
        },
        {
            code: `
                @Component({
                    host: {
                        id: 'cmp-id',
                        title: 'title',
                        class: 'cmp',
                        '[value]': 'value()',
                        '(click)': 'handleClick()'
                    }
                })
                class TestComponent {}
            `,
        },
        {
            code: `
                @Component({
                    host: {
                        title: 'title',
                        id: 'identifier',
                        class: 'klass'
                    }
                })
                class TestComponent {}
            `,
            options: [{decorators: ['Directive']}],
        },
        {
            code: `
                @Directive({
                    host: {
                        class: 'cmp',
                        id: 'cmp-id',
                        '#control': 'control',
                        '*defer': 'isReady()',
                        '@fade': 'fade()',
                        '[@fade.start]': 'onFadeStart()',
                        '[(value)]': 'value()',
                        '[value]': 'value()',
                        '(click)': 'handleClick()'
                    }
                })
                class TestDirective {}
            `,
            options: [{attributeGroups: ['$ANGULAR'], decorators: ['Directive']}],
        },
        {
            code: `
                @Component({
                    host: {
                        class: 'klass',
                        id: 'identifier',
                        role: 'button',
                        title: 'title'
                    }
                })
                class TestComponent {}
            `,
            options: [{attributeGroups: ['$HTML']}],
        },
        {
            code: `
                @Directive({
                    host: {
                        class: 'klass',
                        id: 'identifier',
                        'data-test': 'test',
                        href: '/docs',
                        title: 'title',
                        'aria-label': 'label'
                    }
                })
                class TestDirective {}
            `,
            options: [{attributeGroups: ['$CODE_GUIDE'], decorators: ['Directive']}],
        },
        {
            code: `
                @Component({
                    host: {
                        ...sharedHost,
                        id: 'cmp-id',
                        class: 'cmp'
                    }
                })
                class TestComponent {}
            `,
        },
    ],
});
