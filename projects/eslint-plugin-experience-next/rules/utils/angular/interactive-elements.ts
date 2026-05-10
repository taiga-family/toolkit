import {type TmplAstElement} from '@angular-eslint/bundled-angular-compiler';

import {getStaticAttributeValue, hasElementAttribute} from './element-attributes';

export function isInteractiveElement(node: TmplAstElement): boolean {
    const tagName = node.name.toLowerCase();

    if (hasElementAttribute(node, 'tabindex')) {
        return true;
    }

    switch (tagName) {
        case 'a':
            return hasElementAttribute(node, ['href', 'routerLink']);
        case 'area':
            return hasElementAttribute(node, 'href');
        case 'audio':
            return hasElementAttribute(node, 'controls');
        case 'button':
            return true;
        case 'details':
            return true;
        case 'embed':
            return true;
        case 'iframe':
            return true;
        case 'img':
            return hasElementAttribute(node, 'usemap');
        case 'input':
            return (
                getStaticAttributeValue(node, 'type')?.trim().toLowerCase() !== 'hidden'
            );
        case 'label':
            return true;
        case 'select':
            return true;
        case 'summary':
            return true;
        case 'textarea':
            return true;
        case 'video':
            return hasElementAttribute(node, 'controls');
        default:
            return false;
    }
}
