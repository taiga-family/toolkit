const {existsSync, readFileSync, rmSync, writeFileSync} = require('node:fs');

const [, , changelogPath, releasePath] = process.argv;

if (!changelogPath || !releasePath) {
    throw new Error(
        'Usage: node insert-changelog-release.js <CHANGELOG.md> <release.md>',
    );
}

const marker = 'All notable changes to this project will be documented in this file.';
const titlePattern = /^#\s*changelog(?:\.md)?\s*$/im;
const releaseTitlePattern =
    /^#{2,3}\s+\[v?\d+\.\d+\.\d[^\]]*\](?:\([^)]+\))?(?:\s+\(\d{4}-\d{2}-\d{2}\))?\s*$/m;

function getLineBreak(text) {
    return text.includes('\r\n') ? '\r\n' : '\n';
}

function insertAfter(text, search, value) {
    const index = text.indexOf(search);

    if (index === -1) {
        return null;
    }

    const insertIndex = index + search.length;

    return `${text.slice(0, insertIndex)}${value}${text.slice(insertIndex)}`;
}

function insertAfterTitle(text, value) {
    const match = titlePattern.exec(text);

    if (!match) {
        return null;
    }

    const lineBreak = getLineBreak(text);
    const lineEndIndex = text.indexOf(lineBreak, match.index);

    const insertIndex =
        lineEndIndex === -1 ? match.index + match[0].length : lineEndIndex;

    return `${text.slice(0, insertIndex)}${value}${text.slice(insertIndex)}`;
}

function insertBeforeFirstRelease(text, value) {
    const match = releaseTitlePattern.exec(text);

    if (!match) {
        return null;
    }

    return `${text.slice(0, match.index).trimEnd()}${value}${text.slice(match.index)}`;
}

try {
    const changelog = existsSync(changelogPath)
        ? readFileSync(changelogPath, 'utf8')
        : '';

    const release = readFileSync(releasePath, 'utf8').trim();

    if (!release) {
        throw new Error(`Generated release changelog is empty: ${releasePath}`);
    }

    const lineBreak = getLineBreak(changelog);
    const trimmedChangelog = changelog.trim();

    const releaseBlock = `${lineBreak}${lineBreak}${release}${lineBreak}${lineBreak}`;
    const markerReleaseBlock = `${lineBreak}${lineBreak}${release}`;
    const titleReleaseBlock = `${lineBreak}${lineBreak}${release}`;

    const nextChangelog = trimmedChangelog
        ? (insertBeforeFirstRelease(changelog, releaseBlock) ??
          insertAfter(changelog, marker, markerReleaseBlock) ??
          insertAfterTitle(changelog, titleReleaseBlock) ??
          `${release}${lineBreak}${lineBreak}${trimmedChangelog}${lineBreak}`)
        : `${release}${lineBreak}`;

    writeFileSync(changelogPath, nextChangelog);
} finally {
    rmSync(releasePath, {force: true});
}
