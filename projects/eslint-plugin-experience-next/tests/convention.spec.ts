import {rules} from '@typescript-eslint/eslint-plugin';
import * as tsParser from '@typescript-eslint/parser';
import {RuleTester} from '@typescript-eslint/rule-tester';

import {
    TUI_CUSTOM_TAIGA_NAMING_CONVENTION as custom,
    TUI_RECOMMENDED_NAMING_CONVENTION as recommended,
} from '../rules/convention';

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

const rule = rules['naming-convention'];

ruleTester.run('Recommended naming convention', rule, {
    invalid: [
        {
            code: 'export class test_component {}',
            errors: [{messageId: 'doesNotMatchFormat'}],
            options: recommended,
        },
        {
            code: 'export function test_function() {}',
            errors: [{messageId: 'doesNotMatchFormat'}],
            options: recommended,
        },
        {
            code: 'export interface test_interface {}',
            errors: [{messageId: 'doesNotMatchFormat'}],
            options: recommended,
        },
        {
            code: 'const snake_case_var = 42;',
            errors: [{messageId: 'doesNotMatchFormat'}],
            options: recommended,
        },
    ],
    valid: [
        {
            code: 'export class TestComponent {}',
            options: recommended,
        },
        {
            code: 'export abstract class AbstractService {}',
            options: recommended,
        },
        {
            code: 'export function testFunction() {}',
            options: recommended,
        },
        {
            code: 'export interface TestInterface {}',
            options: recommended,
        },
        {
            code: 'const testVariable = 42;',
            options: recommended,
        },
        {
            code: 'const TEST_CONSTANT = 42;',
            options: recommended,
        },
        {
            code: 'const {someNormalProp} = object;',
            options: recommended,
        },
        {
            code: 'export enum TestEnum { Value }',
            options: recommended,
        },
    ],
});

ruleTester.run('Taiga naming convention', rule, {
    invalid: [
        {
            code: 'export class TestComponent {}',
            errors: [{messageId: 'missingAffix'}],
            options: custom,
        },
        {
            code: 'export interface TestInterface {}',
            errors: [{messageId: 'missingAffix'}],
            options: custom,
        },
        {
            code: 'export function testFunction() {}',
            errors: [{messageId: 'missingAffix'}],
            options: custom,
        },
        {
            code: 'export type TestType = string;',
            errors: [{messageId: 'missingAffix'}],
            options: custom,
        },
        {
            code: 'export enum TestEnum { Value }',
            errors: [{messageId: 'missingAffix'}],
            options: custom,
        },
        {
            code: 'export abstract class TestService {}',
            errors: [{messageId: 'missingAffix'}],
            options: custom,
        },
    ],
    valid: [
        {
            code: 'export class TuiComponent {}',
            options: custom,
        },
        {
            code: 'export abstract class AbstractTuiService {}',
            options: custom,
        },
        {
            code: 'export abstract class TuiAbstractService {}',
            options: custom,
        },
        {
            code: 'export function tuiTestFunction() {}',
            options: custom,
        },
        {
            code: 'export interface TuiTestInterface {}',
            options: custom,
        },
        {
            code: 'export type TuiTestType = string;',
            options: custom,
        },
        {
            code: 'export enum TuiTestEnum { Value }',
            options: custom,
        },
        {
            code: 'const testVariable = 42;',
            options: custom,
        },
    ],
});
