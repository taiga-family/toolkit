import {RuleTester} from 'eslint';

import rule from '../rules/no-href-with-router-link';

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@html-eslint/parser'),
    },
});

ruleTester.run('no-href-with-router-link', rule, {
    invalid: [
        {
            code: '<a href="/utils/miscellaneous" routerLink="/utils/miscellaneous">Text</a>',
            errors: [
                {
                    messageId: 'no-href-with-router-link',
                },
            ],
            output: '<a  routerLink="/utils/miscellaneous">Text</a>',
        },
        {
            code: '<a routerLink="/home" href="/home" class="link">Home</a>',
            errors: [
                {
                    messageId: 'no-href-with-router-link',
                },
            ],
            output: '<a routerLink="/home"  class="link">Home</a>',
        },
        {
            code: '<a href="#section" routerlink="/docs">Documentation</a>',
            errors: [
                {
                    messageId: 'no-href-with-router-link',
                },
            ],
            output: '<a  routerlink="/docs">Documentation</a>',
        },
        {
            code: '<a id="mylink" href="/page" routerLink="/page" title="Link">Go to page</a>',
            errors: [
                {
                    messageId: 'no-href-with-router-link',
                },
            ],
            output: '<a id="mylink"  routerLink="/page" title="Link">Go to page</a>',
        },
    ],
    valid: [
        {
            code: '<a href="/utils/miscellaneous">Text</a>',
        },
        {
            code: '<a routerLink="/utils/miscellaneous">Text</a>',
        },
        {
            code: '<a>Text</a>',
        },
        {
            code: '<button routerLink="/home">Home</button>',
        },
        {
            code: '<div href="/test">Not an anchor</div>',
        },
        {
            code: '<a routerLink="/home" class="link">Home</a>',
        },
        {
            code: '<a href="#section">Section link</a>',
        },
        {
            code: '<a href="mailto:test@example.com">Email</a>',
        },
        {
            code: '<a href="tel:+1234567890">Phone</a>',
        },
    ],
});
