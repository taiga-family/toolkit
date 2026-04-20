import {RuleTester} from 'eslint';

import requireLang from '../rules/require-lang';

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@angular-eslint/template-parser')},
});

ruleTester.run('require-lang', requireLang, {
    invalid: [
        {
            code: /* HTML */ '<html><head></head><body></body></html>',
            errors: [{messageId: 'missing'}],
        },
        {
            code: /* HTML */ '<html lang=""><head></head><body></body></html>',
            errors: [{messageId: 'empty'}],
        },
    ],
    valid: [
        {
            code: /* HTML */ '<html lang="en"><head></head><body></body></html>',
        },
        {
            code: /* HTML */ '<html [attr.lang]="locale"><head></head><body></body></html>',
        },
    ],
});
