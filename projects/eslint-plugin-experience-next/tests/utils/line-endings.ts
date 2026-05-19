export function withCrLf(value: string): string {
    return value.replaceAll('\n', '\r\n');
}
