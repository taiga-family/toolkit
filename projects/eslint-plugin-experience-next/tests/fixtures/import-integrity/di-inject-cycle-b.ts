import {DiCycleAClass} from './di-inject-cycle-a';

export class DiCycleBClass {
    // @ts-ignore
    public readonly children = contentChildren(DiCycleAClass);
}
