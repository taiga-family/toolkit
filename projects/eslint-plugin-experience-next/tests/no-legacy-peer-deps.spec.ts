import {rule} from '../rules/no-legacy-peer-deps';
import {parseForESLint} from '../rules/utils/parsers/npmrc-parser';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({languageOptions: {parser: {parseForESLint}}});

ruleTester.run('no-legacy-peer-deps', rule, {
    invalid: [
        {
            code: 'legacy-peer-deps=true',
            errors: [{messageId: 'noLegacyPeerDeps'}],
        },
        {
            code: 'legacy-peer-deps = true',
            errors: [{messageId: 'noLegacyPeerDeps'}],
        },
        {
            code: 'LEGACY-PEER-DEPS=TRUE',
            errors: [{messageId: 'noLegacyPeerDeps'}],
        },
        {
            code: 'Legacy-Peer-Deps=True',
            errors: [{messageId: 'noLegacyPeerDeps'}],
        },
        {
            code: 'save-exact=true\nlegacy-peer-deps=true\nregistry=https://registry.npmjs.org/',
            errors: [{messageId: 'noLegacyPeerDeps'}],
        },
        {
            code: '  legacy-peer-deps=true  ',
            errors: [{messageId: 'noLegacyPeerDeps'}],
        },
    ],
    valid: [
        {code: 'save-exact=true'},
        {code: 'legacy-peer-deps=false'},
        {code: '# legacy-peer-deps=true'},
        {code: '; legacy-peer-deps=true'},
        {code: 'registry=https://registry.npmjs.org/'},
        {code: ''},
        {code: 'legacy-peer-deps'},
    ],
});
