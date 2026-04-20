import {RuleTester} from 'eslint';

import requireImgAlt from '../rules/require-img-alt';

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@angular-eslint/template-parser')},
});

ruleTester.run('require-img-alt', requireImgAlt, {
    invalid: [
        {
            code: /* HTML */ '<img src="a.png">',
            errors: [{messageId: 'missingAlt'}],
        },
    ],
    valid: [
        {code: /* HTML */ '<img src="a.png" alt="Preview">'},
        {code: /* HTML */ '<img src="a.png" [attr.alt]="label">'},
        {code: /* HTML */ '<img src="a.png" [alt]="label">'},
    ],
});
