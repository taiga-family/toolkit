interface NpmrcAST {
    type: 'Program';
    body: never[];
    comments: never[];
    tokens: never[];
    range: [number, number];
    loc: {
        start: {line: number; column: number};
        end: {line: number; column: number};
    };
}

function buildAST(text: string): NpmrcAST {
    const lines = text.split('\n');
    const lastLine = lines[lines.length - 1] ?? '';

    return {
        body: [],
        comments: [],
        loc: {
            end: {column: lastLine.length, line: lines.length},
            start: {column: 0, line: 1},
        },
        range: [0, text.length],
        tokens: [],
        type: 'Program',
    };
}

export function parse(text: string): NpmrcAST {
    return buildAST(text);
}

export function parseForESLint(text: string): {
    ast: NpmrcAST;
    visitorKeys: Record<string, string[]>;
    scopeManager: null;
    services: Record<string, never>;
} {
    return {
        ast: buildAST(text),
        scopeManager: null,
        services: {},
        visitorKeys: {Program: []},
    };
}
