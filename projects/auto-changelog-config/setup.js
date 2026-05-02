/* eslint-disable @typescript-eslint/no-invalid-this */
module.exports = function (Handlebars) {
    Handlebars.registerHelper('replaceCommit', function (context) {
        const commit =
            /^(build|chore|ci|deprecate|docs|feat|fix|perf|refactor|revert|style|test)\s?(\((.*?)\))?!?: (.*)$/;

        const string = context.fn(this);
        const parsed = commit.exec(string) ?? [];
        const [, , , scope = '', rawTitle = ''] = parsed;

        const title = rawTitle.replace(/\s+\(#\d+\)\s*$/, '');
        const result = scope ? `**${scope.toLocaleLowerCase()}**: ${title}` : title;

        return result || 'empty commit name';
    });

    Handlebars.registerHelper('replaceTitle', function (context) {
        const string = context.fn(this);

        return string.replace('v', '');
    });

    Handlebars.registerHelper('commit-parser', (merges, commits, options) => {
        const commitsFromMerges = merges.map((merge) => ({
            ...merge.commit,
            pullRequest: {
                id: merge.id,
                href: merge.href,
            },
        }));

        const result = commits.concat(commitsFromMerges);

        return options.fn(result);
    });
};
