import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);

function getAngularVersion(): number {
    try {
        const {major} = require('@angular/cli').VERSION;

        return Number.parseInt(major, 10);
    } catch {
        return 16;
    }
}

export const angularVersion = getAngularVersion();

export const modernAngularRules = {
    defaultStandalone: 19,
    modernStyles: 17,
    preferControlFlow: 17,
    preferSignals: 17,
    templateLiteral: 19,
} as const;
