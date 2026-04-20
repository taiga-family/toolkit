import {RuleTester} from 'eslint';

import noDuplicateInHead from '../rules/no-duplicate-in-head';

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@angular-eslint/template-parser')},
});

ruleTester.run('no-duplicate-in-head', noDuplicateInHead, {
    invalid: [
        {
            code: /* HTML */ `
                <!doctype html>
                <html lang="en">
                    <head>
                        <title>One</title>
                        <title>Two</title>
                    </head>
                    <body></body>
                </html>
            `,
            errors: [{messageId: 'duplicateTag'}],
        },
        {
            code: /* HTML */ `
                <!doctype html>
                <html lang="en">
                    <head>
                        <meta charset="utf-8" />
                        <meta charset="windows-1251" />
                    </head>
                    <body></body>
                </html>
            `,
            errors: [{messageId: 'duplicateTag'}],
        },
    ],
    valid: [
        {
            code: /* HTML */ `
                <!doctype html>
                <html lang="en">
                    <head>
                        <title>One</title>
                        <link
                            rel="canonical"
                            href="https://example.com"
                        />
                    </head>
                    <body></body>
                </html>
            `,
        },
    ],
});
