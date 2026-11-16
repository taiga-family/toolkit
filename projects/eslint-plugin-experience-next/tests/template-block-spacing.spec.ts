import {RuleTester} from 'eslint';

import {rule} from '../rules/recommended/template-block-spacing';
import {withCrLf} from './utils/line-endings';

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@angular-eslint/template-parser')},
});

const error = {messageId: 'templateBlockSpacingMissingBlankLine'};

ruleTester.run('template-block-spacing', rule, {
    invalid: [
        {
            code: '@let current = tasks.state();\n<section></section>',
            errors: [error],
            output: '@let current = tasks.state();\n\n<section></section>',
        },
        {
            code: '@let a = 1;\n@let b = 2;\n<div>{{ a + b }}</div>',
            errors: [error],
            output: '@let a = 1;\n@let b = 2;\n\n<div>{{ a + b }}</div>',
        },
        {
            code: '<h2>Tasks</h2>\n@switch (state) {\n    @case ("loading") {\n        <p>Loading</p>\n    }\n}',
            errors: [error],
            output: '<h2>Tasks</h2>\n\n@switch (state) {\n    @case ("loading") {\n        <p>Loading</p>\n    }\n}',
        },
        {
            code: '@if (ready) {\n    <p>Ready</p>\n}\n@for (item of items; track item) {\n    <p>{{ item }}</p>\n}',
            errors: [error],
            output: '@if (ready) {\n    <p>Ready</p>\n}\n\n@for (item of items; track item) {\n    <p>{{ item }}</p>\n}',
        },
        {
            code: '<section>\n    @let value = getValue();\n    <h2>{{ value }}</h2>\n    @if (value) {\n        <p>Content</p>\n    }\n</section>',
            errors: [error, error],
            output: '<section>\n    @let value = getValue();\n\n    <h2>{{ value }}</h2>\n\n    @if (value) {\n        <p>Content</p>\n    }\n</section>',
        },
        {
            code: '@defer (on idle) {\n    <p>Deferred</p>\n}\n<div>Later</div>',
            errors: [error],
            output: '@defer (on idle) {\n    <p>Deferred</p>\n}\n\n<div>Later</div>',
        },
        {
            code: withCrLf('@let a = 1;\n<div>{{ a }}</div>'),
            errors: [error],
            output: withCrLf('@let a = 1;\n\n<div>{{ a }}</div>'),
        },
        {
            code: '<section>\n    @if (ready) {\n        <p>Ready</p>\n    }\n    <p>Footer</p>\n</section>',
            errors: [error],
            output: '<section>\n    @if (ready) {\n        <p>Ready</p>\n    }\n\n    <p>Footer</p>\n</section>',
        },
    ],
    valid: [
        {code: '@let a = 1;\n@let b = 2;\n\n<section></section>'},
        '@if (ready) {\n    <p>Yes</p>\n} @else {\n    <p>No</p>\n}',
        '@switch (state) {\n    @case ("a") {\n        <p>A</p>\n    }\n    @case ("b") {\n        <p>B</p>\n    }\n}',
        '@for (item of items; track item) {\n    <p>{{ item }}</p>\n} @empty {\n    <p>Empty</p>\n}',
        '<div>\n    <section>A</section>\n    <section>B</section>\n</div>',
        '@let value = 1;\n<!-- Keep this comment with the element -->\n<div>{{ value }}</div>',
        '<div>\n    @if (ready) {\n        <p>Ready</p>\n    }\n    <!-- Keep this comment -->\n    <p>Footer</p>\n</div>',
        '<span>\n    @if (ready) {\n        <b>Ready</b>\n    }\n    <b>Always</b>\n</span>',
        '<pre>\n    @if (ready) {\n        <span>Ready</span>\n    }\n    <span>Always</span>\n</pre>',
        '@let value = 1;\n{{ value }}',
    ],
});
