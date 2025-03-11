import {execSync} from 'node:child_process';

export function getGitDiffLines(): string[] {
    try {
        return execSync('git diff --name-only --staged').toString().trim().split('\n');
    } catch {
        return [];
    }
}
