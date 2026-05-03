const path = require('node:path');

const configPath = path.dirname(
    require.resolve('@taiga-ui/auto-changelog-config/package.json'),
);

const commitPattern = String.raw`^(feat|fix)(\([^)]*\))?!?:`;
const breakingPattern = String.raw`^(feat|fix)(\([^)]*\))!:`;

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
        changelog: 'git log --pretty=format:"* %s (%H)" ${latestTag}...HEAD',
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
        releaseNotes: `${changelog} --unreleased-only --stdout`,
        timeout: 60_000,
    },
    hooks: {
        'after:bump': [
            'git tag v${version}', // for include last tag inside CHANGELOG
            'echo "new version is v${version}"',
            `${changelog} --prepend --starting-version v$\{version} -p > /dev/null`,
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
