import {
    type TmplAstLetDeclaration,
    type TmplAstNode,
    TmplAstRecursiveVisitor,
    type TmplAstReference,
    type TmplAstVariable,
    tmplAstVisitAll,
} from '@angular-eslint/bundled-angular-compiler';

export class TemplateIdentifierCollector extends TmplAstRecursiveVisitor {
    constructor(private readonly names: Set<string>) {
        super();
    }

    public override visitLetDeclaration(node: TmplAstLetDeclaration): void {
        this.names.add(node.name);
    }

    public override visitReference(node: TmplAstReference): void {
        this.names.add(node.name);
    }

    public override visitVariable(node: TmplAstVariable): void {
        this.names.add(node.name);
    }
}

export function getTemplateNodes(ast: unknown): readonly TmplAstNode[] {
    if (!ast || typeof ast !== 'object' || !('templateNodes' in ast)) {
        return [];
    }

    const {templateNodes} = ast as Record<'templateNodes', unknown>;

    return Array.isArray(templateNodes) ? (templateNodes as TmplAstNode[]) : [];
}

export function collectTemplateIdentifiers(ast: unknown): Set<string> {
    const names = new Set<string>();

    tmplAstVisitAll(new TemplateIdentifierCollector(names), [...getTemplateNodes(ast)]);

    return names;
}
