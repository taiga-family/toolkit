/* eslint-disable @typescript-eslint/no-invalid-this */
module.exports = function (Handlebars) {
    const getCommitAuthor = (commit) =>
        commit.pullRequest?.author?.login ??
        commit.pullRequest?.author ??
        commit.author ??
        '';

    const normalizeContributor = (author) => {
        const name = String(author).trim().replace(/^@/, '');

        if (
            !name ||
            name.includes('bot') ||
            name === 'github-actions' ||
            name === 'renovate'
        ) {
            return '';
        }

        return `@${name}`;
    };

    const formatContributors = (contributors) => {
        if (contributors.length === 1) {
            return contributors[0];
        }

        if (contributors.length === 2) {
            return `${contributors[0]} and ${contributors[1]}`;
        }

        return `${contributors.slice(0, -1).join(', ')} and ${
            contributors[contributors.length - 1]
        }`;
    };

    Handlebars.registerHelper('replaceCommit', function (context) {
        const commit =
            /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)\s?(\((.*?)\))?!?: (.*)$/g;

        const string = context.fn(this);
        const parsed = Array.from(string.matchAll(commit) ?? [])[0] ?? [];
        const [, , , scope = '', title = ''] = parsed;
        const result = scope ? `**${scope.toLocaleLowerCase()}**: ${title}` : title;

        return result || 'empty commit name';
    });

    Handlebars.registerHelper('replaceTitle', function (context) {
        const string = context.fn(this);

        return string.replace('v', '');
    });

    Handlebars.registerHelper('contributors', function (...args) {
        const options = args.pop();
        const commits = args.flat().filter(Boolean);

        const contributors = [
            ...new Set(
                commits.map(getCommitAuthor).map(normalizeContributor).filter(Boolean),
            ),
        ];

        if (!contributors.length) {
            return '';
        }

        return options.fn({
            contributors,
            text: `Thanks ${formatContributors(contributors)}!`,
        });
    });
};
