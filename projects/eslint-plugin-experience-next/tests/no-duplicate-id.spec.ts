import {RuleTester} from 'eslint';

import noDuplicateId from '../rules/recommended/no-duplicate-id';

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@angular-eslint/template-parser')},
});

ruleTester.run('no-duplicate-id', noDuplicateId, {
    invalid: [
        {
            code: /* HTML */ '<div id="dup"></div><span id="dup"></span>',
            errors: [{messageId: 'duplicateId'}, {messageId: 'duplicateId'}],
        },
    ],
    valid: [
        {code: /* HTML */ '<div id="one"></div><span id="two"></span>'},
        {code: /* HTML */ '<div [id]="dynamic"></div><span id="static"></span>'},
    ],
});
