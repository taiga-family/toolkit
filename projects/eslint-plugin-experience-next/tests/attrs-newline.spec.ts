import {RuleTester} from 'eslint';

import attrsNewline from '../rules/recommended/attrs-newline';

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@angular-eslint/template-parser')},
});

ruleTester.run('attrs-newline', attrsNewline, {
    invalid: [
        {
            code: /* HTML */ '<div id="a" class="b" title="c"></div>',
            errors: [{messageId: 'newlineMissing'}],
            output: '<div\nid="a"\nclass="b"\ntitle="c"\n></div>',
        },
    ],
    valid: [
        {code: /* HTML */ '<div id="a" class="b"></div>'},
        {code: /* HTML */ '<div\nid="a"\nclass="b"\ntitle="c"\n></div>'},
    ],
});
