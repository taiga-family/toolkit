/* eslint-disable @typescript-eslint/no-invalid-this */
module.exports = function (Handlebars) {
    const firstNonEmptyString = (...values) =>
        values.map((value) => String(value ?? '').trim()).find(Boolean) ?? '';

    const toArray = (value) => (Array.isArray(value) ? value : []);

    const escape = (value) => Handlebars.escapeExpression(String(value ?? ''));

    const commitPattern =
        /^(?:build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)\s?(?:\((?<scope>[^)]*)\))?!?: (?<title>.*)$/;

    const getPullRequestId = (href) => {
        const [, id = ''] =
            String(href ?? '').match(
                /\/(?:pull|merge_requests|pull-requests)\/(\d+)(?:$|[/?#])/,
            ) ?? [];

        return id;
    };

    const getPullRequestIdFromText = (text) => {
        const [, id = ''] = String(text ?? '').match(/\s\(#(\d+)\)\s*$/) ?? [];

        return id;
    };

    const getPullRequest = (merge, subject) => {
        const href = firstNonEmptyString(merge.href, merge.pullRequest?.href);

        const id = firstNonEmptyString(
            merge.id,
            merge.number,
            merge.pullRequest?.id,
            merge.pullRequest?.number,
            getPullRequestId(href),
            getPullRequestIdFromText(merge.message),
            getPullRequestIdFromText(subject),
        );

        if (!id) {
            return;
        }

        return {
            id,
            href,
        };
    };

    const getPullRequestFromCommit = (commit) => {
        const subject = firstNonEmptyString(commit.subject, commit.message);
        const id = getPullRequestIdFromText(subject);

        if (!id) {
            return;
        }

        return {id};
    };

    const normalizeMerge = (merge) => {
        const commit = merge.commit ?? {};
        const subject = firstNonEmptyString(commit.subject, merge.message);

        return {
            ...commit,
            href: firstNonEmptyString(commit.href),
            pullRequest: getPullRequest(merge, subject),
            shorthash: firstNonEmptyString(commit.shorthash, merge.shorthash),
            subject,
        };
    };

    const normalizeCommit = (commit) => ({
        ...commit,
        href: firstNonEmptyString(commit.href),
        pullRequest: commit.pullRequest ?? getPullRequestFromCommit(commit),
        shorthash: firstNonEmptyString(commit.shorthash),
        subject: firstNonEmptyString(commit.subject, commit.message),
    });

    const getCommitKey = (commit) =>
        firstNonEmptyString(
            commit.pullRequest?.id ? `pr:${commit.pullRequest.id}` : '',
            commit.hash ? `hash:${commit.hash}` : '',
            commit.shorthash ? `hash:${commit.shorthash}` : '',
            commit.href,
            commit.subject,
        );

    const uniqueCommits = (commits) => [
        ...commits
            .reduce((map, commit) => {
                const key = getCommitKey(commit);

                if (key && !map.has(key)) {
                    map.set(key, commit);
                }

                return map;
            }, new Map())
            .values(),
    ];

    const formatCommitTitle = (subject) => {
        const string = String(subject ?? '').trim();
        const {scope = '', title = ''} = commitPattern.exec(string)?.groups ?? {};
        const cleanTitle = title.replace(/\s\(#\d+\)\s*$/, '');

        if (!cleanTitle) {
            return escape(string || 'empty commit name');
        }

        return scope
            ? `**${escape(scope.toLowerCase())}**: ${escape(cleanTitle)}`
            : escape(cleanTitle);
    };

    const formatPullRequestReference = (commit) => {
        const pullRequest = commit.pullRequest;

        if (!pullRequest?.id) {
            return '';
        }

        const text = `#${escape(pullRequest.id)}`;

        return pullRequest.href
            ? `([${text}](${escape(pullRequest.href)}))`
            : `(${text})`;
    };

    const formatCommitReference = (commit) => {
        if (!commit.shorthash) {
            return '';
        }

        const text = `(${escape(commit.shorthash)})`;

        return commit.href ? `[${text}](${escape(commit.href)})` : text;
    };

    const formatChangelogEntry = (commit) =>
        [
            formatCommitTitle(commit.subject),
            formatPullRequestReference(commit),
            formatCommitReference(commit),
        ]
            .filter(Boolean)
            .join(' ');

    Handlebars.registerHelper('commit-parser', function (merges, commits, options) {
        const commitsFromMerges = toArray(merges).map(normalizeMerge);
        const directCommits = toArray(commits).map(normalizeCommit);
        const result = uniqueCommits(commitsFromMerges.concat(directCommits));

        return options.fn(result);
    });

    Handlebars.registerHelper('replaceCommit', function (context) {
        return new Handlebars.SafeString(formatCommitTitle(context.fn(this)));
    });

    Handlebars.registerHelper('changelogEntry', function () {
        return new Handlebars.SafeString(formatChangelogEntry(this));
    });

    Handlebars.registerHelper('replaceTitle', function (context) {
        const string = String(context.fn(this)).trim();

        return string.replace(/^v/, '');
    });
};
