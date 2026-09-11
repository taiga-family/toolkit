import {describe, expect, it} from '@jest/globals';

import config, {tuiSwitchNgDevMode} from '../jest-preset.ts';

describe('Jest config (backward-compatible alias)', () => {
    it('moduleNameMapper is not empty', () => {
        expect(config.moduleNameMapper).toBeInstanceOf(Object);
    });

    it('bare preset is an alias for the Angular preset', () => {
        expect(config.preset).toBe('jest-preset-angular');
        expect(config.testEnvironment).toBe('jsdom');
    });

    it('re-exports tuiSwitchNgDevMode', () => {
        expect(typeof tuiSwitchNgDevMode).toBe('function');
    });
});
