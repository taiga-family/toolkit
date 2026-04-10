// noinspection AngularBindingTypeMismatch,AngularMissingRequiredDirectiveInputBinding

import angular from 'angular-eslint';
import {ESLint} from 'eslint';

import noProjectAsInNgTemplate from '../rules/no-project-as-in-ng-template';

const RULE_ID = '@taiga-ui/experience-next/no-project-as-in-ng-template';

const testPlugin = {rules: {'no-project-as-in-ng-template': noProjectAsInNgTemplate}};

describe('recommended config — HTML integration', () => {
    let eslint: ESLint;

    beforeAll(() => {
        eslint = new ESLint({
            overrideConfig: [
                {
                    files: ['**/*.html'],
                    plugins: {
                        '@angular-eslint/template': angular.templatePlugin,
                        '@taiga-ui/experience-next': testPlugin,
                    },
                    languageOptions: {parser: require('@angular-eslint/template-parser')},
                    rules: {
                        '@taiga-ui/experience-next/no-project-as-in-ng-template': 'error',
                    },
                },
            ],
            overrideConfigFile: true,
        });
    });

    it('reports no-project-as-in-ng-template for ng-container with *ngTemplateOutlet and ngProjectAs', async () => {
        const [result] = await eslint.lintText(
            '<ng-container *ngTemplateOutlet="tpl" ngProjectAs="[slot]"></ng-container>',
            {filePath: 'test.html'},
        );

        expect(result?.messages.some((message) => message.ruleId === RULE_ID)).toBe(true);
    });

    it('does not report no-project-as-in-ng-template for a plain element with ngProjectAs', async () => {
        const [result] = await eslint.lintText(
            '<div ngProjectAs="[someSlot]">content</div>',
            {filePath: 'test.html'},
        );

        expect(result?.messages.some((message) => message.ruleId === RULE_ID)).toBe(
            false,
        );
    });
});
