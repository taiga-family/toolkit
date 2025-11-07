/* eslint-disable @typescript-eslint/no-invalid-this */
module.exports = function (
    /** @type {{ registerHelper: (arg0: string, arg1: { (context: any): any; (context: any): any; }) => void; }} */
    Handlebars,
) {
    Handlebars.registerHelper('replaceCommit', function (context) {
        const commit =
            /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)\s?(\((.*?)\))?!?: (.*?)$/g;

        // @ts-ignore
        const string = context.fn(this);
        const parsed = Array.from(string.matchAll(commit) ?? [])[0] ?? [];
        const [, , , scope = '', title = ''] = parsed;
        const result = scope ? `**${scope.toLocaleLowerCase()}**: ${title}` : title;

        return result || 'empty commit name';
    });

    Handlebars.registerHelper('replaceTitle', function (context) {
        // @ts-ignore
        const string = context.fn(this);

        return string.replace('v', '');
    });

    // @ts-ignore
    Handlebars.registerHelper('commit-parser', (merges, commits, options) => {
        // @ts-ignore
        const commitsFromMerges = merges.map((merge) => merge.commit);
        const result = commits.concat(commitsFromMerges);

        return options.fn(result);
    });
};
