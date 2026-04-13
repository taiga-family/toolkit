import {RuleTester} from 'eslint';
import templateParser from '@angular-eslint/template-parser';

import rule from '../rules/html-logical-properties';

const ruleTester = new RuleTester({
    languageOptions: {parser: templateParser},
});

ruleTester.run('html-logical-properties', rule, {
    invalid: [
        {
            code: /* HTML */ '<div [style.left.rem]="spacing"></div>',
            errors: [{messageId: 'html-logical-properties'}],
            output: /* HTML */ '<div [style.inset-inline-start.rem]="spacing"></div>',
        },
        {
            code: /* HTML */ '<div [style.right]="spacing"></div>',
            errors: [{messageId: 'html-logical-properties'}],
            output: /* HTML */ '<div [style.inset-inline-end]="spacing"></div>',
        },
        {
            code: /* HTML */ '<div [style.top.px]="offset"></div>',
            errors: [{messageId: 'html-logical-properties'}],
            output: /* HTML */ '<div [style.inset-block-start.px]="offset"></div>',
        },
        {
            code: /* HTML */ '<div [style.bottom]="val"></div>',
            errors: [{messageId: 'html-logical-properties'}],
            output: /* HTML */ '<div [style.inset-block-end]="val"></div>',
        },
        {
            code: /* HTML */ '<div [style.margin-left.rem]="spacing"></div>',
            errors: [{messageId: 'html-logical-properties'}],
            output: /* HTML */ '<div [style.margin-inline-start.rem]="spacing"></div>',
        },
        {
            code: /* HTML */ '<div [style.margin-right]="spacing"></div>',
            errors: [{messageId: 'html-logical-properties'}],
            output: /* HTML */ '<div [style.margin-inline-end]="spacing"></div>',
        },
        {
            code: /* HTML */ '<div [style.margin-top.px]="val"></div>',
            errors: [{messageId: 'html-logical-properties'}],
            output: /* HTML */ '<div [style.margin-block-start.px]="val"></div>',
        },
        {
            code: /* HTML */ '<div [style.margin-bottom]="val"></div>',
            errors: [{messageId: 'html-logical-properties'}],
            output: /* HTML */ '<div [style.margin-block-end]="val"></div>',
        },
        {
            code: /* HTML */ '<div [style.padding-left.rem]="spacing"></div>',
            errors: [{messageId: 'html-logical-properties'}],
            output: /* HTML */ '<div [style.padding-inline-start.rem]="spacing"></div>',
        },
        {
            code: /* HTML */ '<div [style.padding-right]="spacing"></div>',
            errors: [{messageId: 'html-logical-properties'}],
            output: /* HTML */ '<div [style.padding-inline-end]="spacing"></div>',
        },
        {
            code: /* HTML */ '<div [style.padding-top.px]="val"></div>',
            errors: [{messageId: 'html-logical-properties'}],
            output: /* HTML */ '<div [style.padding-block-start.px]="val"></div>',
        },
        {
            code: /* HTML */ '<div [style.padding-bottom]="val"></div>',
            errors: [{messageId: 'html-logical-properties'}],
            output: /* HTML */ '<div [style.padding-block-end]="val"></div>',
        },
        {
            code: /* HTML */ '<div [style.border-left.px]="val"></div>',
            errors: [{messageId: 'html-logical-properties'}],
            output: /* HTML */ '<div [style.border-inline-start.px]="val"></div>',
        },
        {
            code: /* HTML */ '<div [style.border-right]="val"></div>',
            errors: [{messageId: 'html-logical-properties'}],
            output: /* HTML */ '<div [style.border-inline-end]="val"></div>',
        },
        {
            code: /* HTML */ '<div [style.border-top.px]="val"></div>',
            errors: [{messageId: 'html-logical-properties'}],
            output: /* HTML */ '<div [style.border-block-start.px]="val"></div>',
        },
        {
            code: /* HTML */ '<div [style.border-bottom]="val"></div>',
            errors: [{messageId: 'html-logical-properties'}],
            output: /* HTML */ '<div [style.border-block-end]="val"></div>',
        },
    ],
    valid: [
        {code: /* HTML */ '<div [style.inset-inline-start.rem]="spacing"></div>'},
        {code: /* HTML */ '<div [style.inset-inline-end]="spacing"></div>'},
        {code: /* HTML */ '<div [style.inset-block-start.px]="offset"></div>'},
        {code: /* HTML */ '<div [style.inset-block-end]="val"></div>'},
        {code: /* HTML */ '<div [style.margin-inline-start.rem]="spacing"></div>'},
        {code: /* HTML */ '<div [style.padding-inline-end]="spacing"></div>'},
        {code: /* HTML */ '<div [style.border-block-start.px]="val"></div>'},
        {code: /* HTML */ '<div [style.color]="color"></div>'},
        {code: /* HTML */ '<div [style.width.px]="width"></div>'},
        {code: /* HTML */ '<div [style.font-size.rem]="size"></div>'},
    ],
});
