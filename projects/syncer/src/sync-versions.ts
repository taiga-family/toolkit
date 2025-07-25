import {readFileSync, writeFileSync} from 'node:fs';

import {glob} from 'glob';

const INDENTATION = 4;

interface BumpDepsOptions {
    deps: Record<string, Record<string, unknown> | string>;
    isPeerDependency?: boolean;
    newVersion: string;
    prevVersion: string;
    matchPackageNames: readonly string[];
    ignorePackageNames: readonly string[];
}

interface Options {
    newVersion: string;
    includePaths: readonly string[];
    matchPackageNames: readonly string[];
    ignorePackageNames: readonly string[];
}

export function tuiSyncVersions(options: Options): void {
    const {ignorePackageNames, includePaths, matchPackageNames, newVersion} = options;

    const patterns = includePaths.map((pattern) =>
        pattern.endsWith('.json')
            ? pattern
            : `${pattern}/**/*(package.json|package-lock.json)`,
    );

    const files = patterns
        .map((pattern) => glob.sync(pattern, {ignore: '**/node_modules/**'}))
        .flatMap((files) => files)
        .filter((file) => !file.includes('node_modules'));

    for (const file of files) {
        const originalJSON = JSON.stringify(
            JSON.parse(readFileSync(file).toString()),
            null,
            INDENTATION,
        );
        const packageJson = JSON.parse(originalJSON);
        const prevVersion = packageJson.version;

        if (!prevVersion) {
            continue;
        }

        tuiUpdatePackageJsonStructure({
            ignorePackageNames,
            isPackageLockFile: file.endsWith('-lock.json'),
            matchPackageNames,
            newVersion,
            packageJson,
            prevVersion,
        });

        const updatedJSON = JSON.stringify(packageJson, null, 4);

        if (originalJSON !== updatedJSON) {
            writeFileSync(file, `${updatedJSON}\n`);
            console.info(`[synchronized]: ${file}`);
        } else {
            console.info(`[no changes]: ${file}`);
        }
    }
}

export function tuiBumpDeps(options: BumpDepsOptions): void {
    const {
        deps,
        ignorePackageNames,
        isPeerDependency,
        matchPackageNames,
        newVersion,
        prevVersion,
    } = options;

    Object.keys(deps)
        .filter((key) =>
            tuiIsMatchedPackageName({ignorePackageNames, matchPackageNames, name: key}),
        )
        .forEach((key) => {
            const value = deps[key] as
                | Record<string, Record<string, string>>
                | string
                | undefined;

            if (typeof value === 'string') {
                deps[key] = isPeerDependency
                    ? value.replace(prevVersion, newVersion)
                    : `^${newVersion}`;
            } else if (deps[key]?.hasOwnProperty('requires')) {
                tuiBumpDeps({
                    deps: value?.requires ?? {},
                    ignorePackageNames,
                    isPeerDependency,
                    matchPackageNames,
                    newVersion,
                    prevVersion,
                });
            }
        });
}

interface MatchedOptions {
    name: string | undefined;
    matchPackageNames: readonly string[];
    ignorePackageNames: readonly string[];
}

export function tuiIsMatchedPackageName(options: MatchedOptions): boolean {
    const {ignorePackageNames, matchPackageNames, name} = options;

    if (name && ignorePackageNames.includes(name)) {
        return false;
    }

    return !!matchPackageNames.find((match) => !!name?.match(new RegExp(match)));
}

interface UpdatePackageJsonOptions {
    isPackageLockFile: boolean;
    newVersion: string;
    prevVersion: string;
    packageJson: Record<string, Record<string, any> | string>;
    matchPackageNames: readonly string[];
    ignorePackageNames: readonly string[];
}

export function tuiUpdatePackageJsonStructure({
    ignorePackageNames,
    isPackageLockFile,
    matchPackageNames,
    newVersion,
    packageJson,
    prevVersion,
}: UpdatePackageJsonOptions): void {
    const {dependencies, devDependencies, name, packages, peerDependencies} = packageJson;

    if (
        typeof name === 'string' &&
        tuiIsMatchedPackageName({ignorePackageNames, matchPackageNames, name})
    ) {
        if ('version' in packageJson && typeof packageJson['version'] === 'string') {
            packageJson['version'] = newVersion;
        }
    }

    if (isObject(dependencies)) {
        tuiBumpDeps({
            deps: dependencies,
            ignorePackageNames,
            matchPackageNames,
            newVersion,
            prevVersion,
        });
    }

    if (isObject(peerDependencies)) {
        tuiBumpDeps({
            deps: peerDependencies,
            ignorePackageNames,
            isPeerDependency: true,
            matchPackageNames,
            newVersion,
            prevVersion,
        });
    }

    if (isObject(devDependencies)) {
        tuiBumpDeps({
            deps: devDependencies,
            ignorePackageNames,
            matchPackageNames,
            newVersion,
            prevVersion,
        });
    }

    if (isPackageLockFile && isObject(packages)) {
        for (const packageLockJson of Object.values(packages)) {
            if (
                !tuiIsMatchedPackageName({
                    ignorePackageNames,
                    matchPackageNames,
                    name: packageLockJson?.name,
                })
            ) {
                continue;
            }

            tuiUpdatePackageJsonStructure({
                ignorePackageNames,
                isPackageLockFile: true,
                matchPackageNames,
                newVersion,
                packageJson: packageLockJson,
                prevVersion,
            });
        }
    }
}

function isObject<T extends Record<string, any>>(
    value: unknown,
): value is NonNullable<T> {
    return typeof value === 'object' && !!value;
}
