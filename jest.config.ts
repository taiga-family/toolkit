import config from './projects/jest-config/jest-preset.ts';

export default {
    ...config,
    setupFilesAfterEnv: ['<rootDir>/projects/jest-config/angular/polyfill.ts'],
};
