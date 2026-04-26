export const value = 1;

export interface OnlyType {
    readonly value: string;
}

export function known(): number {
    return value;
}
