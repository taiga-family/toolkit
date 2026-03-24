import {rules} from '@typescript-eslint/eslint-plugin';

import {
    TUI_CUSTOM_TAIGA_NAMING_CONVENTION as custom,
    TUI_RECOMMENDED_NAMING_CONVENTION as recommended,
} from '../rules/convention';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {projectService: {allowDefaultProject: ['*.ts*']}},
    },
});

const rule = rules['naming-convention'];

ruleTester.run('Recommended naming convention', rule, {
    invalid: [
        {
            code: /* TypeScript */ 'export class test_component {}',
            errors: [{messageId: 'doesNotMatchFormat'}],
            options: recommended,
        },
        {
            code: /* TypeScript */ 'export function test_function() {}',
            errors: [{messageId: 'doesNotMatchFormat'}],
            options: recommended,
        },
        {
            code: /* TypeScript */ 'export interface test_interface {}',
            errors: [{messageId: 'doesNotMatchFormat'}],
            options: recommended,
        },
        {
            code: /* TypeScript */ 'const snake_case_var = 42;',
            errors: [{messageId: 'doesNotMatchFormat'}],
            options: recommended,
        },
    ],
    valid: [
        {
            code: /* TypeScript */ 'export class TestComponent {}',
            options: recommended,
        },
        {
            code: /* TypeScript */ 'export abstract class AbstractService {}',
            options: recommended,
        },
        {
            code: /* TypeScript */ 'export function testFunction() {}',
            options: recommended,
        },
        {
            code: /* TypeScript */ 'export interface TestInterface {}',
            options: recommended,
        },
        {
            code: /* TypeScript */ 'const testVariable = 42;',
            options: recommended,
        },
        {
            code: /* TypeScript */ 'const TEST_CONSTANT = 42;',
            options: recommended,
        },
        {
            code: /* TypeScript */ 'const {someNormalProp} = object;',
            options: recommended,
        },
        {
            code: /* TypeScript */ 'export enum TestEnum { Value }',
            options: recommended,
        },
    ],
});

ruleTester.run('Taiga naming convention', rule, {
    invalid: [
        {
            code: /* TypeScript */ 'export class TestComponent {}',
            errors: [{messageId: 'missingAffix'}],
            options: custom,
        },
        {
            code: /* TypeScript */ 'export interface TestInterface {}',
            errors: [{messageId: 'missingAffix'}],
            options: custom,
        },
        {
            code: /* TypeScript */ 'export function testFunction() {}',
            errors: [{messageId: 'missingAffix'}],
            options: custom,
        },
        {
            code: /* TypeScript */ 'export type TestType = string;',
            errors: [{messageId: 'missingAffix'}],
            options: custom,
        },
        {
            code: /* TypeScript */ 'export enum TestEnum { Value }',
            errors: [{messageId: 'missingAffix'}],
            options: custom,
        },
        {
            code: /* TypeScript */ 'export abstract class TestService {}',
            errors: [{messageId: 'missingAffix'}],
            options: custom,
        },
    ],
    valid: [
        {
            code: /* TypeScript */ 'export class TuiComponent {}',
            options: custom,
        },
        {
            code: /* TypeScript */ 'export abstract class AbstractTuiService {}',
            options: custom,
        },
        {
            code: /* TypeScript */ 'export abstract class TuiAbstractService {}',
            options: custom,
        },
        {
            code: /* TypeScript */ 'export function tuiTestFunction() {}',
            options: custom,
        },
        {
            code: /* TypeScript */ 'export interface TuiTestInterface {}',
            options: custom,
        },
        {
            code: /* TypeScript */ 'export type TuiTestType = string;',
            options: custom,
        },
        {
            code: /* TypeScript */ 'export enum TuiTestEnum { Value }',
            options: custom,
        },
        {
            code: /* TypeScript */ 'const testVariable = 42;',
            options: custom,
        },
    ],
});
