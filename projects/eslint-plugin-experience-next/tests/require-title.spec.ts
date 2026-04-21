import {RuleTester} from 'eslint';

import requireTitle from '../rules/recommended/require-title';

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
        {
            code: /* HTML */ '<!doctype html><html lang="en"><head></head><body></body></html>',
            errors: [{messageId: 'missing'}],
        },
    ],
    valid: [
        {
            code: /* HTML */ '<html lang="en"><head><title>Page</title></head><body></body></html>',
        },
        {
            code: /* HTML */ '<html lang="en"><head><title>{{ pageTitle }}</title></head><body></body></html>',
        },
        {
            code: /* HTML */ '<!doctype html><html lang="en"><head><title>Page</title></head><body></body></html>',
        },
        {
            code: /* HTML */ `
                <!doctype html>
                <html lang="en">
                    <head>
                        <meta charset="UTF-8" />
                        <link
                            href="assets/apple-touch-icon.png"
                            rel="apple-touch-icon"
                            sizes="180x180"
                        />
                        <link
                            href="assets/favicon-32x32.png"
                            rel="icon"
                            sizes="32x32"
                            type="image/png"
                        />
                        <link
                            href="assets/favicon-16x16.png"
                            rel="icon"
                            sizes="16x16"
                            type="image/png"
                        />
                        <link
                            href="manifest.webmanifest"
                            rel="manifest"
                        />
                        <link
                            color="#8c56cf"
                            href="assets/safari-pinned-tab.svg"
                            rel="mask-icon"
                        />
                        <link
                            href="assets/favicon.ico"
                            rel="shortcut icon"
                        />
                        <meta
                            content="#603cba"
                            name="msapplication-TileColor"
                        />
                        <meta
                            content="assets/browserconfig.xml"
                            name="msapplication-config"
                        />
                        <meta
                            content="#ffffff"
                            name="theme-color"
                        />
                        <meta
                            content="width=device-width, initial-scale=1"
                            name="viewport"
                        />
                        <title>Web APIs for Angular</title>
                    </head>
                    <body>
                        <app></app>
                    </body>
                </html>
            `,
        },
    ],
});
