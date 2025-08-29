import {rules} from '@typescript-eslint/eslint-plugin';
import * as tsParser from '@typescript-eslint/parser';
import {RuleTester} from '@typescript-eslint/rule-tester';

import {
    TUI_NO_RESTRICTED_ANGULAR_MODERN_IMPORTS,
    TUI_NO_RESTRICTED_IMPORTS,
} from '../rules/no-restricted-imports';

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsParser,
        parserOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
        },
    },
});

const rule = rules['no-restricted-imports'];
const common = {patterns: TUI_NO_RESTRICTED_IMPORTS};
const modern = {patterns: TUI_NO_RESTRICTED_ANGULAR_MODERN_IMPORTS};

ruleTester.run('no-restricted-imports - CommonModule restriction', rule, {
    invalid: [
        {
            code: "import { CommonModule } from '@angular/common';",
            errors: [{messageId: 'patternAndImportNameWithCustomMessage'}],
            options: [common],
        },
        {
            code: "import { CommonModule, AsyncPipe } from '@angular/common';",
            errors: [{messageId: 'patternAndImportNameWithCustomMessage'}],
            options: [common],
        },
    ],
    valid: [
        {
            code: "import { AsyncPipe } from '@angular/common';",
            options: [common],
        },
        {
            code: "import { DatePipe, JsonPipe } from '@angular/common';",
            options: [common],
        },
        {
            code: "import { Component } from '@angular/core';",
            options: [common],
        },
    ],
});

ruleTester.run('no-restricted-imports - Control flow restrictions', rule, {
    invalid: [
        {
            code: "import { NgIf } from '@angular/common';",
            errors: [{messageId: 'patternAndImportNameWithCustomMessage'}],
            options: [modern],
        },
        {
            code: "import { NgForOf } from '@angular/common';",
            errors: [{messageId: 'patternAndImportNameWithCustomMessage'}],
            options: [modern],
        },
        {
            code: "import { NgSwitch } from '@angular/common';",
            errors: [{messageId: 'patternAndImportNameWithCustomMessage'}],
            options: [modern],
        },
        {
            code: "import { NgSwitchCase } from '@angular/common';",
            errors: [{messageId: 'patternAndImportNameWithCustomMessage'}],
            options: [modern],
        },
        {
            code: "import { NgSwitchDefault } from '@angular/common';",
            errors: [{messageId: 'patternAndImportNameWithCustomMessage'}],
            options: [modern],
        },
        {
            code: "import { NgIf, NgForOf, NgSwitch } from '@angular/common';",
            errors: [
                {messageId: 'patternAndImportNameWithCustomMessage'},
                {messageId: 'patternAndImportNameWithCustomMessage'},
                {messageId: 'patternAndImportNameWithCustomMessage'},
            ],
            options: [modern],
        },
    ],
    valid: [
        {
            code: "import { AsyncPipe } from '@angular/common';",
            options: [modern],
        },
        {
            code: "import { DatePipe, JsonPipe } from '@angular/common';",
            options: [modern],
        },
        {
            code: "import { Component } from '@angular/core';",
            options: [modern],
        },
    ],
});
