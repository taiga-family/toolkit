import config from './projects/jest-config/angular/jest-preset.ts';

export default {
    ...config,
    setupFilesAfterEnv: ['<rootDir>/projects/jest-config/angular/polyfill.ts'],
};
