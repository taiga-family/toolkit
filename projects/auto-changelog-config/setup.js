/* eslint-disable @typescript-eslint/no-invalid-this */
module.exports = function (Handlebars) {
    const getPullRequestId = (href) => href?.match(/\/pull\/(\d+)/)?.[1] ?? '';

    const normalizePullRequest = (commit) => {
        const pullRequest = commit.pullRequest ?? {};
        const href = pullRequest.href ?? commit.href ?? '';
        const id =
            pullRequest.id ??
            pullRequest.number ??
            commit.id ??
            commit.number ??
            getPullRequestId(href);

        if (!href && !id) {
            return;
        }

        return {
            ...pullRequest,
            id,
            author: pullRequest.author ?? commit.author,
            href,
        };
    };

    const normalizeCommit = (commit) => {
        const subject =
            commit.subject ??
            commit.message ??
            commit.title ??
            commit.pullRequest?.title ??
            '';

        const pullRequest = normalizePullRequest(commit);

        return {
            ...commit,
            message: commit.message ?? subject,
            pullRequest,
            subject,
        };
    };

    const getCommitAuthor = (commit) => {
        const author =
            commit.pullRequest?.author?.login ??
            commit.pullRequest?.user?.login ??
            commit.author?.login ??
            commit.user?.login ??
            commit.pullRequest?.author ??
            commit.author ??
            '';

        return String(author);
    };

    const isGithubLogin = (name) => /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(name);

    const normalizeContributor = (author) => {
        const name = String(author).trim().replace(/^@/, '');

        const isBot =
            name.endsWith('[bot]') ||
            name.endsWith('-bot') ||
            name.endsWith('bot') ||
            name === 'github-actions' ||
            name === 'renovate';

        if (!name || isBot || !isGithubLogin(name)) {
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

        const commits = args.flat().filter(Boolean).map(normalizeCommit);

        const unique = [
            ...new Map(
                commits.map((commit) => [
                    commit.hash ??
                        commit.shorthash ??
                        commit.pullRequest?.href ??
                        commit.href ??
                        commit.subject,
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

        return result || string || 'empty commit name';
    });

    Handlebars.registerHelper('replaceTitle', function (context) {
        const string = String(context.fn(this));

        return string.replace(/^v/, '');
    });

    Handlebars.registerHelper('contributors', function (...args) {
        const options = args.pop();

        const commits = args.flat().filter(Boolean).map(normalizeCommit);

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
