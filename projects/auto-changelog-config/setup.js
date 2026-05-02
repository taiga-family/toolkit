/* eslint-disable @typescript-eslint/no-invalid-this */
module.exports = function (Handlebars) {
    const getCommitAuthor = (commit) =>
        commit.pullRequest?.author?.login ??
        commit.pullRequest?.author ??
        commit.author ??
        '';

    const normalizeContributor = (author) => {
        const name = String(author).trim().replace(/^@/, '') ?? '';

        const isBot =
            name.endsWith('bot') ||
            name.endsWith('[bot]') ||
            name === 'github-actions' ||
            name === 'renovate';

        if (!name || isBot) {
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

    Handlebars.registerHelper('commit-parser', function (...args) {
        const options = args.pop();

        const commits = args.flat().filter(Boolean);

        const unique = [
            ...new Map(
                commits.map((commit) => [
                    commit.hash ?? commit.shorthash ?? commit.href ?? commit.subject,
                    commit,
                ]),
            ).values(),
        ];

        return options.fn(unique);
    });

    Handlebars.registerHelper('replaceCommit', function (context) {
        const commit =
            /^(?:build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)\s?(?:\((?<scope>[^)]*)\))?!?: (?<title>.*)$/;

        const string = String(context.fn(this));
        const {scope = '', title = ''} = commit.exec(string)?.groups ?? {};
        const result = scope ? `**${scope.toLowerCase()}**: ${title}` : title;

        return result || 'empty commit name';
    });

    Handlebars.registerHelper('replaceTitle', function (context) {
        const string = String(context.fn(this));

        return string.replace(/^v/, '');
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
