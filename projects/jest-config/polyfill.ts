/// <reference types="@types/jest" />
/// <reference types="@types/node" />
import {setupZoneTestEnv} from 'jest-preset-angular/setup-env/zone';
import ResizeObserver from 'resize-observer-polyfill';

import {tuiSwitchNgDevMode} from './utils/switch-ng-dev-mode';

const {TextDecoder: TextDecoderMock, TextEncoder: TextEncoderMock} = require('node:util'); // drop it after migrate zone less mode

tuiSwitchNgDevMode(false);

setupZoneTestEnv();

global.TextEncoder = TextEncoderMock;
global.TextDecoder = TextDecoderMock;
global.ResizeObserver = ResizeObserver;

Object.defineProperty(global.document, 'execCommand', {
    value: () => {},
    writable: true,
});

// you can also pass the mock implementation
// to jest.fn as an argument
(global.window as any).IntersectionObserver = jest.fn(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
}));

global.window.resizeTo = (width) => {
    (global.window as any).innerWidth = width || global.window.innerWidth;
    (global.window as any).innerHeight = width || global.window.innerHeight;

    // Simulate window resize events
    global.window.dispatchEvent(new Event('resize', {bubbles: true, cancelable: true}));
};

global.URL.createObjectURL = jest.fn(String);
global.URL.revokeObjectURL = jest.fn();

Object.defineProperty(global.window, 'CSS', {value: null});

Object.defineProperty(global.window, 'getComputedStyle', {
    value: () => ({
        appearance: ['-webkit-appearance'],
        display: 'none',
    }),
});

Object.defineProperty(global.document, 'doctype', {
    value: '<!DOCTYPE html>',
});

Object.defineProperty(global.document.body.style, 'transform', {
    value: () => ({
        configurable: true,
        enumerable: true,
    }),
});

Object.defineProperty(global.window, 'matchMedia', {
    value: jest.fn().mockImplementation((query) => ({
        addEventListener: jest.fn(),
        addListener: jest.fn(),
        dispatchEvent: jest.fn(),
        matches: false,
        media: query,
        onchange: null,
        removeEventListener: jest.fn(),
        removeListener: jest.fn(),
    })),
    writable: true,
});

Object.defineProperty(global.document, 'elementFromPoint', {
    value: jest.fn().mockImplementation(() => null),
    writable: true,
});

Object.defineProperty(global.document, 'createRange', {
    value: () => {
        const range = new Range();

        range.getBoundingClientRect = () => ({
            width: 0,
            bottom: 0,
            height: 0,
            left: 0,
            right: 0,
            toJSON: () => {},
            top: 0,
            x: 0,
            y: 0,
        });

        range.getClientRects = () => ({
            item: () => null,
            length: 0,
            [Symbol.iterator]: jest.fn(),
        });

        return range;
    },
    writable: true,
});

Object.defineProperty(window, 'scrollTo', jest.fn());

Object.defineProperty(global.window, 'getComputedStyle', {
    value: () => ({
        getPropertyValue: (_prop: string) => '',
    }),
});

global.DataTransfer = class {
    private readonly data = new Map();

    public setData(format: string, data: string): void {
        this.data.set(format, data);
    }

    public getData(format: string): string {
        return this.data.get(format);
    }
} as unknown as typeof DataTransfer;

class TransferMockEvent {
    protected dataTransfer: DataTransfer;
    protected relatedTarget: EventTarget;

    constructor(
        protected readonly type: string,
        protected readonly options: {
            clipboardData: DataTransfer;
            relatedTarget: EventTarget;
        },
    ) {
        this.dataTransfer = options.clipboardData;
        this.relatedTarget = options.relatedTarget;
    }
}

global.DragEvent = TransferMockEvent as unknown as typeof DragEvent;
global.ClipboardEvent = TransferMockEvent as unknown as typeof ClipboardEvent;

// Need before initialize any static methods
global.Date = class extends Date {
    constructor(...args: DateConstructor[]) {
        // @ts-ignore
        super(...(args.length === 0 ? ['2023-02-15T00:00:00Z'] : args));
    }
} as unknown as DateConstructor;

/**
 * in our jest setupFilesAfterEnv file,
 * however when running with ng test those
 * imports are already done by angular
 * resulting in duplicate imports
 * and conflicts resulting in the above error
 */
if (!('Zone' in global)) {
    require('zone.js');
    require('zone.js/testing');
}

if (typeof globalThis.structuredClone !== 'function') {
    globalThis.structuredClone = (obj: unknown) => JSON.parse(JSON.stringify(obj));
}

if (typeof globalThis.setImmediate !== 'function') {
    globalThis.setImmediate = ((fn: (...args: unknown[]) => void, ...args: unknown[]) =>
        setTimeout(fn, 0, ...args)) as unknown as typeof globalThis.setImmediate;
}

if (typeof globalThis.clearImmediate !== 'function') {
    globalThis.clearImmediate = ((timeoutId: number | undefined) =>
        clearTimeout(timeoutId)) as unknown as typeof globalThis.clearImmediate;
}
