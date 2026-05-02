/* eslint-disable @typescript-eslint/no-invalid-this */
module.exports = function (Handlebars) {
    const firstNonEmptyString = (...values) =>
        values.map((value) => String(value ?? '').trim()).find(Boolean) ?? '';

    const getPullRequestId = (href) => {
        const [, id = ''] =
            String(href ?? '').match(
                /\/(?:pull|merge_requests|pull-requests)\/(\d+)(?:$|[/?#])/,
            ) ?? [];

        return id;
    };

    const normalizePullRequest = (commit) => {
        const pullRequest = commit.pullRequest ?? {};
        const href = firstNonEmptyString(pullRequest.href, commit.href);

        const id = firstNonEmptyString(
            pullRequest.id,
            pullRequest.number,
            getPullRequestId(href),
        );

        if (!id) {
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
        const subject = firstNonEmptyString(
            commit.subject,
            commit.message,
            commit.title,
            commit.pullRequest?.title,
        );

        const pullRequest = normalizePullRequest(commit);

        return {
            ...commit,
            message: firstNonEmptyString(commit.message, subject),
            pullRequest,
            subject,
        };
    };

    const getCommitAuthor = (commit) =>
        commit.pullRequest?.author?.login ??
        commit.pullRequest?.user?.login ??
        commit.author?.login ??
        commit.user?.login ??
        commit.pullRequest?.author ??
        commit.author ??
        '';

    const isGithubLogin = (name) => /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(name);

    const normalizeContributor = (author) => {
        const name = String(author).trim().replace(/^@/, '');
        const lowerName = name.toLowerCase();

        const isBot =
            lowerName.endsWith('[bot]') ||
            lowerName.endsWith('-bot') ||
            lowerName === 'dependabot' ||
            lowerName === 'renovatebot' ||
            lowerName === 'github-actions' ||
            lowerName === 'renovate' ||
            lowerName === 'gemini-code-assist';

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
                    firstNonEmptyString(
                        commit.hash,
                        commit.shorthash,
                        commit.pullRequest?.href,
                        commit.href,
                        commit.subject,
                    ),
                    commit,
                ]),
            ).values(),
        ];

        return options.fn(unique);
    });

    Handlebars.registerHelper('replaceCommit', function (context) {
        const commit =
            /^(?:build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)\s?(?:\((?<scope>[^)]*)\))?!?: (?<title>.*)$/;

        const string = String(context.fn(this)).trim();
        const {scope = '', title = ''} = commit.exec(string)?.groups ?? {};
        const result = scope ? `**${scope.toLowerCase()}**: ${title}` : title;

        return result || string || 'empty commit name';
    });

    Handlebars.registerHelper('replaceTitle', function (context) {
        const string = String(context.fn(this)).trim();

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
