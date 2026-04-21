import {RuleTester} from 'eslint';

import {rule} from '../rules/recommended/no-href-with-router-link';

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@angular-eslint/template-parser')},
});

ruleTester.run('no-href-with-router-link', rule, {
    invalid: [
        {
            code: /* HTML */ '<a href="/utils/miscellaneous" routerLink="/utils/miscellaneous">Text</a>',
            errors: [{messageId: 'no-href-with-router-link'}],
            output: '<a  routerLink="/utils/miscellaneous">Text</a>',
        },
        {
            code: /* HTML */ '<a routerLink="/home" href="/home" class="link">Home</a>',
            errors: [{messageId: 'no-href-with-router-link'}],
            output: '<a routerLink="/home"  class="link">Home</a>',
        },
        {
            code: /* HTML */ '<a href="#section" routerLink="/docs">Documentation</a>',
            errors: [{messageId: 'no-href-with-router-link'}],
            output: '<a  routerLink="/docs">Documentation</a>',
        },
        {
            code: /* HTML */ '<a id="mylink" href="/page" routerLink="/page" title="Link">Go to page</a>',
            errors: [{messageId: 'no-href-with-router-link'}],
            output: '<a id="mylink"  routerLink="/page" title="Link">Go to page</a>',
        },
    ],
    valid: [
        {code: /* HTML */ '<a href="/utils/miscellaneous">Text</a>'},
        {code: /* HTML */ '<a routerLink="/utils/miscellaneous">Text</a>'},
        {code: /* HTML */ '<a>Text</a>'},
        {code: /* HTML */ '<button routerLink="/home">Home</button>'},
        {code: /* HTML */ '<div href="/test">Not an anchor</div>'},
        {code: /* HTML */ '<a routerLink="/home" class="link">Home</a>'},
        {code: /* HTML */ '<a href="#section">Section link</a>'},
        {code: /* HTML */ '<a href="mailto:test@example.com">Email</a>'},
        {code: /* HTML */ '<a href="tel:+1234567890">Phone</a>'},
    ],
});
