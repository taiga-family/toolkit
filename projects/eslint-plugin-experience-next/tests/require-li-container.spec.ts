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
        {code: /* HTML */ '<menu><li>Item</li></menu>'},
        {code: /* HTML */ '<ul><li *ngFor="let item of items">{{ item }}</li></ul>'},
    ],
});
