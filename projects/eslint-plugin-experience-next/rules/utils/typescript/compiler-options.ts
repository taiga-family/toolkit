import {type CompilerOptions, ScriptTarget} from 'typescript';

const FALLBACK_SCRIPT_TARGET = ScriptTarget.ES2021;

function normalizeLibName(name: string): string {
    return name
        .toLowerCase()
        .replace(/^lib\./, '')
        .replace(/\.d\.ts$/, '');
}

function isFullEs2022OrLaterLib(name: string): boolean {
    if (name === 'esnext' || name === 'esnext.full') {
        return true;
    }

    const match = /^es(?<year>\d{4})(?:\.full)?$/.exec(name);
    const year = match?.groups?.['year'];

    return year !== undefined && Number(year) >= 2022;
}

function hasBuiltInAtLib(libs: readonly string[] | undefined): boolean {
    if (!libs) {
        return true;
    }

    const normalizedLibs = libs.map(normalizeLibName);
    const hasFullAtLib = normalizedLibs.some(isFullEs2022OrLaterLib);

    const hasPartialAtLibs =
        normalizedLibs.includes('es2022.array') &&
        normalizedLibs.includes('es2022.string');

    return hasFullAtLib || hasPartialAtLibs;
}

export function supportsBuiltInAt(compilerOptions: CompilerOptions): boolean {
    const target = compilerOptions.target ?? FALLBACK_SCRIPT_TARGET;

    return target >= ScriptTarget.ES2022 && hasBuiltInAtLib(compilerOptions.lib);
}
