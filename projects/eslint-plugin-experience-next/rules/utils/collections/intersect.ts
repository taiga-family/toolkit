export function intersect<T>(a: T[], b: T[]): boolean {
    const origin = new Set(b);

    return a.some((type) => origin.has(type));
}
