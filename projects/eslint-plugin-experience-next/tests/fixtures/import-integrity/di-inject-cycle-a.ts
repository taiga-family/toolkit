import {DiCycleBClass} from './di-inject-cycle-b';

export class DiCycleAClass {
    // @ts-ignore
    public readonly b = inject(DiCycleBClass);
}
