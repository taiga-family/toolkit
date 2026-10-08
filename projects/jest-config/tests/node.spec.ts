import {describe, expect, it} from '@jest/globals';

import config from '../node/jest-preset.ts';

describe('Node jest preset', () => {
    it('runs in the node environment', () => {
        expect(config.testEnvironment).toBe('node');
    });

    it('does not rely on jest-preset-angular', () => {
        expect('preset' in config).toBe(false);
        expect(JSON.stringify(config.transform)).not.toContain('jest-preset-angular');
    });

    it('inherits the shared moduleNameMapper', () => {
        expect(config.moduleNameMapper).toBeInstanceOf(Object);
    });
});
