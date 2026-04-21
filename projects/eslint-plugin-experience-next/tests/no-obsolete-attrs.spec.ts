import {RuleTester} from 'eslint';

import noObsoleteAttrs from '../rules/recommended/no-obsolete-attrs';

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@angular-eslint/template-parser')},
});

ruleTester.run('no-obsolete-attrs', noObsoleteAttrs, {
    invalid: [
        {
            code: /* HTML */ '<div align="center"></div>',
            errors: [{messageId: 'obsolete'}],
        },
        {
            code: /* HTML */ '<body bgcolor="red"></body>',
            errors: [{messageId: 'obsolete'}],
        },
    ],
    valid: [
        {code: /* HTML */ '<div class="center"></div>'},
        {code: /* HTML */ '<img [align]="position">'},
    ],
});
