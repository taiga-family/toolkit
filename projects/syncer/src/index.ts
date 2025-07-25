#!/usr/bin/env node

import path from 'node:path';

import {tuiSyncVersions} from './sync-versions';

interface SyncerOptions {
    includePaths: readonly string[];
    matchPackageNames: readonly string[];
    ignorePackageNames: readonly string[];
}

const packageJson: Record<string, any> | undefined = require(
    path.resolve(process.cwd(), './package.json'),
);

const syncerOptions: SyncerOptions | null = packageJson?.syncer ?? null;

if (syncerOptions) {
    tuiSyncVersions({
        ignorePackageNames: syncerOptions.ignorePackageNames,
        includePaths: syncerOptions.includePaths,
        matchPackageNames: syncerOptions.matchPackageNames,
        newVersion: packageJson?.version,
    });
} else {
    throw new Error(`Syncer options not found: ${JSON.stringify(packageJson)}`);
}
