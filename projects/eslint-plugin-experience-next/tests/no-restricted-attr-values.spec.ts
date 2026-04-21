import {RuleTester} from 'eslint';

import noRestrictedAttrValues from '../rules/taiga-specific/no-restricted-attr-values';

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@angular-eslint/template-parser')},
});

const CONFIGURED_MESSAGE =
    'Icons must be configured, for example: \n<button tuiIconButton [iconStart]="options.iconStart" [iconEnd]="options.iconEnd" /> \n<tui-icon [icon]="options.icon" />';

ruleTester.run('no-restricted-attr-values', noRestrictedAttrValues, {
    invalid: [
        {
            code: /* HTML */ '<tui-icon icon="@tui.chevron-down"></tui-icon>',
            errors: [{messageId: 'restricted'}],
            options: [{attrPatterns: ['icon'], attrValuePatterns: ['@tui']}],
        },
        {
            code: /* HTML */ '<button iconStart="@tui.x"></button>',
            errors: [{message: CONFIGURED_MESSAGE}],
            options: [
                {
                    attrPatterns: ['iconStart', 'iconEnd', 'icon'],
                    attrValuePatterns: ['@tui'],
                    message: CONFIGURED_MESSAGE,
                },
            ],
        },
        {
            code: /* HTML */ `
                <tui-icon [icon]="'@tui.alert-circle'"></tui-icon>
            `,
            errors: [{messageId: 'restricted'}],
            options: [{attrPatterns: ['icon'], attrValuePatterns: ['@tui']}],
        },
        {
            code: /* HTML */ `
                <button [iconEnd]="'@tui.close'"></button>
            `,
            errors: [{messageId: 'restricted'}],
            options: [
                {
                    attrPatterns: ['iconEnd'],
                    attrValuePatterns: [String.raw`^@tui\.`],
                },
            ],
        },
    ],
    valid: [
        {
            code: /* HTML */ '<tui-icon icon="custom-icon"></tui-icon>',
            options: [{attrPatterns: ['icon'], attrValuePatterns: ['@tui']}],
        },
        {
            code: /* HTML */ '<tui-icon [icon]="options.icon"></tui-icon>',
            options: [{attrPatterns: ['icon'], attrValuePatterns: ['@tui']}],
        },
        {
            code: /* HTML */ '<tui-icon icon="{{ options.icon }}"></tui-icon>',
            options: [{attrPatterns: ['icon'], attrValuePatterns: ['@tui']}],
        },
        {
            code: /* HTML */ `
                <tui-icon [icon]="'custom-icon'"></tui-icon>
            `,
            options: [{attrPatterns: ['icon'], attrValuePatterns: ['@tui']}],
        },
        {
            code: /* HTML */ '<button iconStart></button>',
            options: [{attrPatterns: ['iconStart'], attrValuePatterns: ['@tui']}],
        },
    ],
});
