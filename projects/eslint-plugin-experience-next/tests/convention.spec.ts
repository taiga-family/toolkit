// @ts-ignore, cannot find module @typescript-eslint/parser or its corresponding type declarations
import * as tsParser from '@typescript-eslint/parser';
import {RuleTester} from 'eslint';

import {
    TUI_CUSTOM_TAIGA_NAMING_CONVENTION,
    TUI_RECOMMENDED_NAMING_CONVENTION,
} from '../rules/convention';

// Import the naming convention rule from typescript-eslint
const allRules = require('@typescript-eslint/eslint-plugin/use-at-your-own-risk/rules');
const namingConventionRule = allRules['naming-convention'];

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsParser,
        parserOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
        },
    },
});

// Test TUI_RECOMMENDED_NAMING_CONVENTION
ruleTester.run('@typescript-eslint/naming-convention (TUI_RECOMMENDED)', namingConventionRule, {
    valid: [
        // Valid PascalCase exported classes
        {
            code: 'export class TestComponent {}',
            options: TUI_RECOMMENDED_NAMING_CONVENTION.slice(1),
        },
        // Valid PascalCase abstract classes
        {
            code: 'export abstract class AbstractService {}',
            options: TUI_RECOMMENDED_NAMING_CONVENTION.slice(1),
        },
        // Valid camelCase exported functions
        {
            code: 'export function testFunction() {}',
            options: TUI_RECOMMENDED_NAMING_CONVENTION.slice(1),
        },
        // Valid PascalCase exported interfaces
        {
            code: 'export interface TestInterface {}',
            options: TUI_RECOMMENDED_NAMING_CONVENTION.slice(1),
        },
        // Valid camelCase variables
        {
            code: 'const testVariable = 42;',
            options: TUI_RECOMMENDED_NAMING_CONVENTION.slice(1),
        },
        // Valid UPPER_CASE variables
        {
            code: 'const TEST_CONSTANT = 42;',
            options: TUI_RECOMMENDED_NAMING_CONVENTION.slice(1),
        },
        // Valid destructured variables (format: null)
        {
            code: 'const {someNormalProp} = object;',
            options: TUI_RECOMMENDED_NAMING_CONVENTION.slice(1),
        },
        // Valid StrictPascalCase exported enums
        {
            code: 'export enum TestEnum { Value }',
            options: TUI_RECOMMENDED_NAMING_CONVENTION.slice(1),
        },
    ],
    invalid: [
        // Invalid snake_case exported class
        {
            code: 'export class test_component {}',
            errors: [{messageId: 'doesNotMatchFormat'}],
            options: TUI_RECOMMENDED_NAMING_CONVENTION.slice(1),
        },
        // Invalid snake_case exported function
        {
            code: 'export function test_function() {}',
            errors: [{messageId: 'doesNotMatchFormat'}],
            options: TUI_RECOMMENDED_NAMING_CONVENTION.slice(1),
        },
        // Invalid snake_case exported interface
        {
            code: 'export interface test_interface {}',
            errors: [{messageId: 'doesNotMatchFormat'}],
            options: TUI_RECOMMENDED_NAMING_CONVENTION.slice(1),
        },
        // Invalid PascalCase variable (should be camelCase or UPPER_CASE) - but actually this is valid for exported variables
        {
            code: 'const snake_case_var = 42;',
            errors: [{messageId: 'doesNotMatchFormat'}],
            options: TUI_RECOMMENDED_NAMING_CONVENTION.slice(1),
        },
    ],
});

// Test TUI_CUSTOM_TAIGA_NAMING_CONVENTION
ruleTester.run('@typescript-eslint/naming-convention (TUI_CUSTOM_TAIGA)', namingConventionRule, {
    valid: [
        // Valid Tui prefixed exported classes
        {
            code: 'export class TuiComponent {}',
            options: TUI_CUSTOM_TAIGA_NAMING_CONVENTION.slice(1),
        },
        // Valid AbstractTui prefixed abstract classes
        {
            code: 'export abstract class AbstractTuiService {}',
            options: TUI_CUSTOM_TAIGA_NAMING_CONVENTION.slice(1),
        },
        // Valid Tui prefixed abstract classes
        {
            code: 'export abstract class TuiAbstractService {}',
            options: TUI_CUSTOM_TAIGA_NAMING_CONVENTION.slice(1),
        },
        // Valid tui prefixed exported functions (PascalCase with tui prefix)
        {
            code: 'export function tuiTestFunction() {}',
            options: TUI_CUSTOM_TAIGA_NAMING_CONVENTION.slice(1),
        },
        // Valid Tui prefixed exported interfaces
        {
            code: 'export interface TuiTestInterface {}',
            options: TUI_CUSTOM_TAIGA_NAMING_CONVENTION.slice(1),
        },
        // Valid Tui prefixed exported type aliases
        {
            code: 'export type TuiTestType = string;',
            options: TUI_CUSTOM_TAIGA_NAMING_CONVENTION.slice(1),
        },
        // Valid Tui prefixed exported enums
        {
            code: 'export enum TuiTestEnum { Value }',
            options: TUI_CUSTOM_TAIGA_NAMING_CONVENTION.slice(1),
        },
        // Valid camelCase variables
        {
            code: 'const testVariable = 42;',
            options: TUI_CUSTOM_TAIGA_NAMING_CONVENTION.slice(1),
        },
    ],
    invalid: [
        // Invalid exported class without Tui prefix
        {
            code: 'export class TestComponent {}',
            errors: [{messageId: 'missingAffix'}],
            options: TUI_CUSTOM_TAIGA_NAMING_CONVENTION.slice(1),
        },
        // Invalid exported interface without Tui prefix
        {
            code: 'export interface TestInterface {}',
            errors: [{messageId: 'missingAffix'}],
            options: TUI_CUSTOM_TAIGA_NAMING_CONVENTION.slice(1),
        },
        // Invalid exported function without tui prefix
        {
            code: 'export function testFunction() {}',
            errors: [{messageId: 'missingAffix'}],
            options: TUI_CUSTOM_TAIGA_NAMING_CONVENTION.slice(1),
        },
        // Invalid exported type without Tui prefix
        {
            code: 'export type TestType = string;',
            errors: [{messageId: 'missingAffix'}],
            options: TUI_CUSTOM_TAIGA_NAMING_CONVENTION.slice(1),
        },
        // Invalid exported enum without Tui prefix
        {
            code: 'export enum TestEnum { Value }',
            errors: [{messageId: 'missingAffix'}],
            options: TUI_CUSTOM_TAIGA_NAMING_CONVENTION.slice(1),
        },
        // Invalid abstract class without proper prefix
        {
            code: 'export abstract class TestService {}',
            errors: [{messageId: 'missingAffix'}],
            options: TUI_CUSTOM_TAIGA_NAMING_CONVENTION.slice(1),
        },
    ],
});