module.exports = {
    parser: 'html',
    plugins: [require.resolve('prettier-plugin-organize-attributes')],
    attributeGroups: ['^(id|name)$', '^x$', '^y$', '^xmlns$', '$DEFAULT'],
    printWidth: 120,
    singleAttributePerLine: false,
};
