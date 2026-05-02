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

    const getPullRequestIdFromText = (text) => {
        const [, id = ''] = String(text ?? '').match(/\s\(#(\d+)\)\s*$/) ?? [];

        return id;
    };

    const isPullRequestHref = (href) =>
        /\/(?:pull|merge_requests|pull-requests)\/\d+(?:$|[/?#])/.test(
            String(href ?? ''),
        );

    const getCommitHashFromHref = (href) => {
        const [, hash = ''] =
            String(href ?? '').match(/\/commit\/([a-f\d]{7,40})(?:$|[/?#])/) ?? [];

        return hash;
    };

    const getRepositoryHref = (href) => {
        const [, repositoryHref = ''] =
            String(href ?? '').match(/^(https?:\/\/[^/]+\/[^/]+\/[^/]+)(?:\/|$)/) ?? [];

        return repositoryHref;
    };

    const getCommitHref = (commit, pullRequest) => {
        const href = firstNonEmptyString(commit.commitHref, commit.href);

        if (href.includes('/commit/')) {
            return href;
        }

        const hash = firstNonEmptyString(
            commit.hash,
            commit.shorthash,
            getCommitHashFromHref(href),
        );

        const repositoryHref = getRepositoryHref(
            firstNonEmptyString(pullRequest?.href, href),
        );

        return hash && repositoryHref ? `${repositoryHref}/commit/${hash}` : '';
    };

    const getCommitHash = (commit, commitHref) =>
        firstNonEmptyString(
            commit.commitHash,
            commit.shorthash,
            getCommitHashFromHref(commitHref),
            String(commit.hash ?? '').slice(0, 7),
        ).slice(0, 7);

    const normalizePullRequest = (commit, subject) => {
        const pullRequest = commit.pullRequest ?? {};
        const href = [pullRequest.href, commit.pullRequestHref, commit.href]
            .map(firstNonEmptyString)
            .find(isPullRequestHref);

        const id = firstNonEmptyString(
            pullRequest.id,
            pullRequest.number,
            getPullRequestId(href),
            getPullRequestIdFromText(subject),
            getPullRequestIdFromText(commit.message),
            getPullRequestIdFromText(commit.title),
        );

        if (!id) {
            return;
        }

        return {
            ...pullRequest,
            id,
            author: pullRequest.author ?? commit.author,
            href: href ?? '',
        };
    };

    const normalizeCommit = (commit) => {
        const subject = firstNonEmptyString(
            commit.subject,
            commit.pullRequest?.title,
            commit.title,
            commit.message,
        );

        const pullRequest = normalizePullRequest(commit, subject);
        const commitHref = getCommitHref(commit, pullRequest);
        const commitHash = getCommitHash(commit, commitHref);

        return {
            ...commit,
            commitHash,
            commitHref,
            message: firstNonEmptyString(commit.message, subject),
            pullRequest,
            subject,
        };
    };

    const getCommitKey = (commit) =>
        firstNonEmptyString(
            commit.pullRequest?.id && `pr:${commit.pullRequest.id}`,
            commit.hash && `hash:${commit.hash}`,
            commit.commitHash && `hash:${commit.commitHash}`,
            commit.subject && `subject:${commit.subject}`,
        );

    const mergePullRequests = (left, right) => {
        if (!left && !right) {
            return;
        }

        if (!left) {
            return right;
        }

        if (!right) {
            return left;
        }

        return {
            ...left,
            ...right,
            id: firstNonEmptyString(left.id, right.id),
            author: left.author ?? right.author,
            href: firstNonEmptyString(left.href, right.href),
        };
    };

    const mergeCommits = (left, right) => ({
        ...left,
        ...right,
        commitHash: firstNonEmptyString(left.commitHash, right.commitHash),
        commitHref: firstNonEmptyString(left.commitHref, right.commitHref),
        hash: firstNonEmptyString(left.hash, right.hash),
        href: firstNonEmptyString(left.href, right.href),
        message: firstNonEmptyString(left.message, right.message),
        pullRequest: mergePullRequests(left.pullRequest, right.pullRequest),
        shorthash: firstNonEmptyString(left.shorthash, right.shorthash),
        subject: firstNonEmptyString(left.subject, right.subject),
    });

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

        const unique = commits.reduce((map, commit) => {
            const key = getCommitKey(commit);

            if (!key) {
                return map;
            }

            const previous = map.get(key);

            map.set(key, previous ? mergeCommits(previous, commit) : commit);

            return map;
        }, new Map());

        return options.fn([...unique.values()]);
    });

    Handlebars.registerHelper('replaceCommit', function (context) {
        const commit =
            /^(?:build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)\s?(?:\((?<scope>[^)]*)\))?!?: (?<title>.*)$/;

        const string = String(context.fn(this)).trim();
        const {scope = '', title = ''} = commit.exec(string)?.groups ?? {};
        const cleanTitle = title.replace(/\s\(#\d+\)\s*$/, '');
        const result = scope ? `**${scope.toLowerCase()}**: ${cleanTitle}` : cleanTitle;

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
