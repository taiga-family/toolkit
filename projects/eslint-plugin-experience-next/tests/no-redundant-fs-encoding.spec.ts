import {rule} from '../rules/recommended/no-redundant-fs-encoding';
import {withCrLf} from './utils/line-endings';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {ecmaVersion: 'latest', sourceType: 'module'},
    },
});

ruleTester.run('no-redundant-fs-encoding', rule, {
    invalid: [
        {
            code: "writeFileSync(file, content, {encoding: 'utf8'});",
            errors: [{messageId: 'noRedundantFsEncoding'}],
            output: 'writeFileSync(file, content);',
        },
        {
            code: "writeFile(file, content, {encoding: 'utf-8'}, callback);",
            errors: [{messageId: 'noRedundantFsEncoding'}],
            output: 'writeFile(file, content, callback);',
        },
        {
            code: "await fsPromises.writeFile(file, content, {encoding: 'UTF-8'});",
            errors: [{messageId: 'noRedundantFsEncoding'}],
            output: 'await fsPromises.writeFile(file, content);',
        },
        {
            code: "appendFileSync(file, content, {encoding: 'utf8'});",
            errors: [{messageId: 'noRedundantFsEncoding'}],
            output: 'appendFileSync(file, content);',
        },
        {
            code: "appendFile(file, content, {encoding: 'utf-8'}, callback);",
            errors: [{messageId: 'noRedundantFsEncoding'}],
            output: 'appendFile(file, content, callback);',
        },
        {
            code: "writeFileSync(file, content, 'utf8');",
            errors: [{messageId: 'noRedundantFsEncoding'}],
            output: 'writeFileSync(file, content);',
        },
        {
            code: "writeFile(file, content, 'UTF-8', callback);",
            errors: [{messageId: 'noRedundantFsEncoding'}],
            output: 'writeFile(file, content, callback);',
        },
        {
            code: "await fsPromises.appendFile(file, content, 'utf-8');",
            errors: [{messageId: 'noRedundantFsEncoding'}],
            output: 'await fsPromises.appendFile(file, content);',
        },
        {
            code: `
                fs.writeFileSync(file, content, {
                    encoding: 'utf8',
                    flag: 'wx',
                });
            `,
            errors: [{messageId: 'noRedundantFsEncoding'}],
            output: `
                fs.writeFileSync(file, content, {
                    flag: 'wx',
                });
            `,
        },
        {
            code: withCrLf(`
                fs.writeFileSync(file, content, {
                    flag: 'wx',
                    encoding: 'utf8',
                });
            `),
            errors: [{messageId: 'noRedundantFsEncoding'}],
            output: withCrLf(`
                fs.writeFileSync(file, content, {
                    flag: 'wx',
                });
            `),
        },
    ],
    valid: [
        {code: "writeFileSync(file, content, {encoding: 'base64'});"},
        {code: "writeFileSync(file, content, {encoding: 'latin1'});"},
        {code: "writeFileSync(file, content, {encoding: 'hex'});"},
        {code: "writeFileSync(file, content, 'base64');"},
        {code: "writeFileSync(file, content, 'latin1');"},
        {code: "writeFileSync(file, content, 'hex');"},
        {code: 'writeFileSync(file, content, {encoding});'},
        {code: 'writeFileSync(file, content, {encoding: getEncoding()});'},
        {code: 'writeFileSync(file, content, encoding);'},
        {code: 'writeFileSync(file, content, getEncoding());'},
        {code: "writeFileSync(file, content, {...options, encoding: 'utf8'});"},
        {code: "writeFileSync(file, content, {encoding: 'base64', encoding: 'utf8'});"},
        {code: "readFileSync(file, {encoding: 'utf8'});"},
        {code: "writer.writeFile(file, content, {encoding: 'utf8'});"},
    ],
});
