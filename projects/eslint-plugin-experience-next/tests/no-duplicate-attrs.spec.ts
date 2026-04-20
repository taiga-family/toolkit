import {RuleTester} from 'eslint';

import noDuplicateAttrs from '../rules/no-duplicate-attrs';

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@angular-eslint/template-parser')},
});

ruleTester.run('no-duplicate-attrs', noDuplicateAttrs, {
    invalid: [
        {
            code: /* HTML */ '<div class="a" class="b"></div>',
            errors: [
                {messageId: 'noDuplicateAttributes', suggestions: 1},
                {messageId: 'noDuplicateAttributes', suggestions: 1},
            ],
        },
    ],
    valid: [
        {code: /* HTML */ '<div class="a" id="b"></div>'},
        {code: /* HTML */ '<input [(ngModel)]="value" />'},
    ],
});
