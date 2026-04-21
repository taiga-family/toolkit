import angular from 'angular-eslint';
import {type Rule} from 'eslint';

import {createRule} from './utils/create-rule';

const noDuplicateAttributesRule =
    angular.templatePlugin.rules?.['no-duplicate-attributes'];

if (!noDuplicateAttributesRule) {
    throw new Error(
        'angular-eslint template rule "no-duplicate-attributes" is not available',
    );
}

export const rule = createRule({
    name: 'no-duplicate-attrs',
    rule: noDuplicateAttributesRule as Rule.RuleModule,
});

export default rule;
