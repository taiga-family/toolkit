import {RuleTester} from 'eslint';

import elementNewline from '../rules/element-newline';

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@angular-eslint/template-parser')},
});

ruleTester.run('element-newline', elementNewline, {
    invalid: [
        {
            code: /* HTML */ '<div><section>One</section><section>Two</section></div>',
            errors: [{messageId: 'expectAfter'}],
            output: '<div>\n<section>One</section><section>Two</section></div>',
        },
    ],
    valid: [
        {code: /* HTML */ '<p><span>One</span><span>Two</span></p>'},
        {
            code: /* HTML */ `
                <div>
                    <section>One</section>
                    <section>Two</section>
                </div>
            `,
        },
    ],
});
