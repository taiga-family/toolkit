import {RuleTester} from 'eslint';

import noObsoleteTags from '../rules/no-obsolete-tags';

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@angular-eslint/template-parser')},
});

ruleTester.run('no-obsolete-tags', noObsoleteTags, {
    invalid: [
        {
            code: /* HTML */ '<font color="red">Hello</font>',
            errors: [{messageId: 'unexpected'}],
        },
    ],
    valid: [
        {code: /* HTML */ '<span class="red">Hello</span>'},
        {code: /* HTML */ '<div><strong>World</strong></div>'},
    ],
});
