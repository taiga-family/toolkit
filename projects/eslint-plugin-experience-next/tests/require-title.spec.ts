import {RuleTester} from 'eslint';

import requireTitle from '../rules/require-title';

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@angular-eslint/template-parser')},
});

ruleTester.run('require-title', requireTitle, {
    invalid: [
        {
            code: /* HTML */ '<html lang="en"><head></head><body></body></html>',
            errors: [{messageId: 'missing'}],
        },
        {
            code: /* HTML */ '<html lang="en"><head><title>   </title></head><body></body></html>',
            errors: [{messageId: 'empty'}],
        },
    ],
    valid: [
        {
            code: /* HTML */ '<html lang="en"><head><title>Page</title></head><body></body></html>',
        },
        {
            code: /* HTML */ '<html lang="en"><head><title>{{ pageTitle }}</title></head><body></body></html>',
        },
    ],
});
