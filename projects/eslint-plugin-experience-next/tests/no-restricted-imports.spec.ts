import * as tsParser from '@typescript-eslint/parser';
import {RuleTester} from '@typescript-eslint/rule-tester';
// Import the built-in ESLint rule
import {builtinRules} from 'eslint/use-at-your-own-risk';

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsParser,
        parserOptions: {
            projectService: {
                allowDefaultProject: ['*.ts*'],
            },
        },
    },
});

const rule = builtinRules.get('no-restricted-imports');

const commonModuleRestriction = {
    paths: [
        {
            importNames: ['CommonModule'],
            message:
                'Import standalone APIs directly instead of CommonModule. Use: AsyncPipe, NgComponentOutlet, NgFor, I18nPluralPipe, NgSwitch, NgSwitchCase, NgSwitchDefault, JsonPipe, DatePipe, UpperCasePipe, LowerCasePipe, CurrencyPipe, PercentPipe, etc.',
            name: '@angular/common',
        },
    ],
};

const controlFlowRestrictions = {
    paths: [
        {
            importNames: ['NgIf'],
            message:
                'Use the built-in @if template control flow instead of NgIf. See: https://angular.io/guide/template-control-flow',
            name: '@angular/common',
        },
        {
            importNames: ['NgForOf'],
            message:
                'Use the built-in @for template control flow instead of NgFor. See: https://angular.io/guide/template-control-flow',
            name: '@angular/common',
        },
        {
            importNames: ['NgSwitch', 'NgSwitchCase', 'NgSwitchDefault'],
            message:
                'Use the built-in @switch template control flow instead of NgSwitch. See: https://angular.io/guide/template-control-flow',
            name: '@angular/common',
        },
    ],
};

ruleTester.run('no-restricted-imports - CommonModule restriction', rule, {
    invalid: [
        {
            code: "import { CommonModule } from '@angular/common';",
            errors: [
                {
                    message:
                        "'CommonModule' import from '@angular/common' is restricted. Import standalone APIs directly instead of CommonModule. Use: AsyncPipe, NgComponentOutlet, NgFor, I18nPluralPipe, NgSwitch, NgSwitchCase, NgSwitchDefault, JsonPipe, DatePipe, UpperCasePipe, LowerCasePipe, CurrencyPipe, PercentPipe, etc.",
                },
            ],
            options: [commonModuleRestriction],
        },
        {
            code: "import { CommonModule, AsyncPipe } from '@angular/common';",
            errors: [
                {
                    message:
                        "'CommonModule' import from '@angular/common' is restricted. Import standalone APIs directly instead of CommonModule. Use: AsyncPipe, NgComponentOutlet, NgFor, I18nPluralPipe, NgSwitch, NgSwitchCase, NgSwitchDefault, JsonPipe, DatePipe, UpperCasePipe, LowerCasePipe, CurrencyPipe, PercentPipe, etc.",
                },
            ],
            options: [commonModuleRestriction],
        },
    ],
    valid: [
        {
            code: "import { AsyncPipe } from '@angular/common';",
            options: [commonModuleRestriction],
        },
        {
            code: "import { DatePipe, JsonPipe } from '@angular/common';",
            options: [commonModuleRestriction],
        },
        {
            code: "import { Component } from '@angular/core';",
            options: [commonModuleRestriction],
        },
    ],
});

ruleTester.run('no-restricted-imports - Control flow restrictions', rule, {
    invalid: [
        {
            code: "import { NgIf } from '@angular/common';",
            errors: [
                {
                    message:
                        "'NgIf' import from '@angular/common' is restricted. Use the built-in @if template control flow instead of NgIf. See: https://angular.io/guide/template-control-flow",
                },
            ],
            options: [controlFlowRestrictions],
        },
        {
            code: "import { NgForOf } from '@angular/common';",
            errors: [
                {
                    message:
                        "'NgForOf' import from '@angular/common' is restricted. Use the built-in @for template control flow instead of NgFor. See: https://angular.io/guide/template-control-flow",
                },
            ],
            options: [controlFlowRestrictions],
        },
        {
            code: "import { NgSwitch } from '@angular/common';",
            errors: [
                {
                    message:
                        "'NgSwitch' import from '@angular/common' is restricted. Use the built-in @switch template control flow instead of NgSwitch. See: https://angular.io/guide/template-control-flow",
                },
            ],
            options: [controlFlowRestrictions],
        },
        {
            code: "import { NgSwitchCase } from '@angular/common';",
            errors: [
                {
                    message:
                        "'NgSwitchCase' import from '@angular/common' is restricted. Use the built-in @switch template control flow instead of NgSwitch. See: https://angular.io/guide/template-control-flow",
                },
            ],
            options: [controlFlowRestrictions],
        },
        {
            code: "import { NgSwitchDefault } from '@angular/common';",
            errors: [
                {
                    message:
                        "'NgSwitchDefault' import from '@angular/common' is restricted. Use the built-in @switch template control flow instead of NgSwitch. See: https://angular.io/guide/template-control-flow",
                },
            ],
            options: [controlFlowRestrictions],
        },
        {
            code: "import { NgIf, NgForOf, NgSwitch } from '@angular/common';",
            errors: [
                {
                    message:
                        "'NgIf' import from '@angular/common' is restricted. Use the built-in @if template control flow instead of NgIf. See: https://angular.io/guide/template-control-flow",
                },
                {
                    message:
                        "'NgForOf' import from '@angular/common' is restricted. Use the built-in @for template control flow instead of NgFor. See: https://angular.io/guide/template-control-flow",
                },
                {
                    message:
                        "'NgSwitch' import from '@angular/common' is restricted. Use the built-in @switch template control flow instead of NgSwitch. See: https://angular.io/guide/template-control-flow",
                },
            ],
            options: [controlFlowRestrictions],
        },
    ],
    valid: [
        {
            code: "import { AsyncPipe } from '@angular/common';",
            options: [controlFlowRestrictions],
        },
        {
            code: "import { DatePipe, JsonPipe } from '@angular/common';",
            options: [controlFlowRestrictions],
        },
        {
            code: "import { Component } from '@angular/core';",
            options: [controlFlowRestrictions],
        },
    ],
});
