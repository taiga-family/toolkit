import {rules} from '@html-eslint/eslint-plugin';
import parser from '@html-eslint/parser';
import {RuleTester} from 'eslint';

const ruleTester = new RuleTester({languageOptions: {parser}});

const rule = rules['no-restricted-attrs']!;

const ruleConfig = {
    attrPatterns: [
        String.raw`\[style\.left(\.[a-z]+)?\]`,
        String.raw`\[style\.right(\.[a-z]+)?\]`,
    ],
    message: 'Use logical CSS properties instead of directional properties.',
    tagPatterns: ['.*'],
};

ruleTester.run('html/no-restricted-attrs - logical CSS properties', rule, {
    invalid: [
        {
            code: '<div [style.left.rem]="spacing">Should use inset-inline-start</div>',
            errors: [
                {
                    message:
                        'Use logical CSS properties instead of directional properties.',
                },
            ],
            options: [ruleConfig],
        },
        {
            code: '<div [style.right]="spacing">Should use inset-inline-end</div>',
            errors: [
                {
                    message:
                        'Use logical CSS properties instead of directional properties.',
                },
            ],
            options: [ruleConfig],
        },
    ],
    valid: [
        {
            code: '<div [style.inset-inline-start.rem]="spacing">Good logical property</div>',
            options: [ruleConfig],
        },
        {
            code: '<div [style.color]="color">Non-spatial property is fine</div>',
            options: [ruleConfig],
        },
    ],
});
