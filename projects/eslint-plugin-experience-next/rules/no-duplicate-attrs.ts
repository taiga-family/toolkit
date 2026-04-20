import angular from 'angular-eslint';
import {type Rule} from 'eslint';

const noDuplicateAttributesRule =
    angular.templatePlugin.rules?.['no-duplicate-attributes'];

if (!noDuplicateAttributesRule) {
    throw new Error(
        'angular-eslint template rule "no-duplicate-attributes" is not available',
    );
}

export const rule = noDuplicateAttributesRule as Rule.RuleModule;

export default rule;
