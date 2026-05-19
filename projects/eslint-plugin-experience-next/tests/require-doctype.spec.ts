import {RuleTester} from 'eslint';

import requireDoctype from '../rules/recommended/require-doctype';
import {withCrLf} from './utils/line-endings';

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@angular-eslint/template-parser')},
});

ruleTester.run('require-doctype', requireDoctype, {
    invalid: [
        {
            code: /* HTML */ '<html lang="en"><head></head><body></body></html>',
            errors: [{messageId: 'missing'}],
            output: '<!DOCTYPE html>\n<html lang="en"><head></head><body></body></html>',
        },
        {
            code: withCrLf(
                /* HTML */ '<!-- comment -->\n<html lang="en"><head></head><body></body></html>',
            ),
            errors: [{messageId: 'missing'}],
            output: withCrLf(
                /* HTML */ '<!DOCTYPE html>\n<!-- comment -->\n<html lang="en"><head></head><body></body></html>',
            ),
        },
    ],
    valid: [
        {
            code: /* HTML */ '<!doctype html><html lang="en"><head></head><body></body></html>',
        },
    ],
});
