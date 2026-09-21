import {describe, expect, it} from '@jest/globals';

import config, {tuiSwitchNgDevMode} from '../angular/jest-preset.ts';

describe('Angular jest preset', () => {
    it('uses jest-preset-angular', () => {
        expect(config.preset).toBe('jest-preset-angular');
    });

    it('runs in jsdom', () => {
        expect(config.testEnvironment).toBe('jsdom');
    });

    it('exposes tuiSwitchNgDevMode', () => {
        expect(typeof tuiSwitchNgDevMode).toBe('function');
    });

    it('inherits the shared moduleNameMapper', () => {
        expect(config.moduleNameMapper).toBeInstanceOf(Object);
    });
});
