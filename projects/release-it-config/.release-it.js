const path = require('node:path');

const configPath = path.resolve(
    process.cwd(),
    'node_modules/@taiga-ui/auto-changelog-config',
);

const commitPattern = String.raw`^(feat|fix|perf)(\([^)]*\))?!?:`;
const breakingPattern = String.raw`^(feat|fix|perf)(\([^)]*\))!:`;

const createChangelog = (template) =>
    [
        'npx auto-changelog',
        `-c ${configPath}/index.json`,
        `--template ${configPath}/${template}`,
        `--handlebars-setup ${configPath}/setup.js`,
        `--commit-pattern ${JSON.stringify(commitPattern)}`,
        `--breaking-pattern ${JSON.stringify(breakingPattern)}`,
    ].join(' ');

const changelog = createChangelog('template.hbs');
const releaseNotes = createChangelog('release-template.hbs');

module.exports = {
    plugins: {
        '@release-it/conventional-changelog': {
            gitRawCommitsOpts: {
                path: '.',
            },
            infile: false,
            path: '.',
            preset: 'conventionalcommits',
        },
    },
    git: {
        addUntrackedFiles: true,
        changelog: `${releaseNotes} --unreleased-only --stdout`,
        commitArgs: '--no-verify',
        commitMessage: 'chore(release): v${version}',
        getLatestTagFromAllRefs: true,
        pushArgs: ['--follow-tags'],
        requireBranch: false,
        requireCleanWorkingDir: false,
        requireCommits: false,
        tagAnnotation: 'Release v${version}',
        tagName: 'v${version}',
    },
    github: {
        comments: {
            issue: ':rocket: _This issue has been resolved in v${version}. See [${releaseName}](${releaseUrl}) for release notes._',
            pr: ':rocket: _This pull request is included in v${version}. See [${releaseName}](${releaseUrl}) for release notes._',
            submit: true,
        },
        release: true,
        releaseNotes: `${releaseNotes} --unreleased-only --stdout`,
        timeout: 60_000,
    },
    hooks: {
        'after:bump': [
            'echo "new version is v${version}"',
            'git tag -f v${version}', // temporary tag for auto-changelog
            `${changelog} --prepend --starting-version v$\{version} -p > /dev/null`, // CHANGELOG.md: without contributors
            'git tag -d v${version}', // remove temporary tag before release-it creates final annotated tag
            'npx prettier CHANGELOG.md --write > /dev/null',
            'git fetch --prune --prune-tags origin',
            'git add CHANGELOG.md',
            'npx syncer || echo ""',
            'npm run after:bump -s || echo ""',
            'git add .',
        ],
        'after:release':
            'echo Successfully released ${name} v${version} to ${repo.repository}.',
        'before:init': 'git fetch --prune --prune-tags origin > /dev/null || echo ""',
        'before:release': 'npm run release',
    },
    npm: {
        allowSameVersion: true,
        publish: false,
        skipChecks: true,
    },
    verbose: true,
};
