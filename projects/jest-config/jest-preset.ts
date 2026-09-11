/**
 * Backward-compatible entry point.
 *
 * The bare `@taiga-ui/jest-config` preset is an alias for the Angular preset.
 * New projects should prefer the explicit `@taiga-ui/jest-config/angular` or
 * `@taiga-ui/jest-config/node` presets.
 */
import angularJestPreset, {tuiSwitchNgDevMode} from './angular/jest-preset.ts';

export default angularJestPreset;
export {tuiSwitchNgDevMode};
