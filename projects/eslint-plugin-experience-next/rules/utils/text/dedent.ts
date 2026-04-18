/**
 * Removes `extraSpaces` leading spaces from every line of `text` that starts
 * with at least that many spaces.
 */
export function dedent(text: string, extraSpaces: number): string {
    if (extraSpaces <= 0) {
        return text;
    }

    const prefix = ' '.repeat(extraSpaces);

    return text
        .split('\n')
        .map((line) => (line.startsWith(prefix) ? line.slice(extraSpaces) : line))
        .join('\n');
}
