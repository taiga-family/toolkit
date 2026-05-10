import {
    type AST,
    type ASTWithSource,
    type Conditional,
} from '@angular-eslint/bundled-angular-compiler';

export function isAstWithSource(node: AST): node is ASTWithSource {
    return 'ast' in node;
}

export function unwrapAstWithSource(node: AST): AST {
    return isAstWithSource(node) ? node.ast : node;
}

export function isConditional(node: AST): node is Conditional {
    return 'condition' in node && 'trueExp' in node && 'falseExp' in node;
}
