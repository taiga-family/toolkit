import {describe, expect, it} from '@jest/globals';

import config from '../jest-preset.ts';

describe('Jest config', () => {
    it('moduleNameMapper is not empty', () => {
        expect(config.moduleNameMapper).toBeInstanceOf(Object);
    });
});
