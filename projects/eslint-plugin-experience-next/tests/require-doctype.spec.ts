import {RuleTester} from 'eslint';

import requireDoctype from '../rules/require-doctype';

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
    ],
    valid: [
        {
            code: /* HTML */ '<!doctype html><html lang="en"><head></head><body></body></html>',
        },
    ],
});
