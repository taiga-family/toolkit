import {RuleTester} from 'eslint';

import requireLiContainer from '../rules/recommended/require-li-container';

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@angular-eslint/template-parser')},
});

ruleTester.run('require-li-container', requireLiContainer, {
    invalid: [
        {
            code: /* HTML */ '<div><li>Item</li></div>',
            errors: [{messageId: 'invalid'}],
        },
    ],
    valid: [
        {code: /* HTML */ '<ul><li>Item</li></ul>'},
        {code: /* HTML */ '<ol><li>Item</li></ol>'},
        {code: /* HTML */ '<menu><li>Item</li></menu>'},
        {code: /* HTML */ '<ul><li *ngFor="let item of items">{{ item }}</li></ul>'},
        {code: /* HTML */ '<ol><li *ngFor="let item of items">{{ item }}</li></ol>'},
        {
            code: /* HTML */ '<ul>@for (item of items; track item) {<li>{{ item }}</li>}</ul>',
        },
        {
            code: /* HTML */ '<ol>@for (item of items; track item) {<li>{{ item }}</li>}</ol>',
        },
        {code: /* HTML */ '<ul>@if (show) {<li>Item</li>}</ul>'},
        {code: /* HTML */ '<ul>@if (show) {<li>A</li>} @else {<li>B</li>}</ul>'},
    ],
});
