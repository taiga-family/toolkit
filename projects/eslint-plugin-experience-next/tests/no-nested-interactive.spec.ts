import {RuleTester} from 'eslint';

import {rule} from '../rules/recommended/no-nested-interactive';

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@angular-eslint/template-parser')},
});

ruleTester.run('no-nested-interactive', rule, {
    invalid: [
        {
            code: /* HTML */ '<button><iframe src="https://example.com"></iframe></button>',
            errors: [{data: {tag: 'button'}, messageId: 'noNestedInteractive'}],
        },
        {
            code: /* HTML */ '<a href="/foo"><button type="button">Click me</button></a>',
            errors: [{data: {tag: 'a'}, messageId: 'noNestedInteractive'}],
        },
        {
            code: /* HTML */ '<button type="button"><a routerLink="/foo">Foo</a></button>',
            errors: [{data: {tag: 'button'}, messageId: 'noNestedInteractive'}],
        },
        {
            code: /* HTML */ '<button type="button"><a [href]="url">Foo</a></button>',
            errors: [{data: {tag: 'button'}, messageId: 'noNestedInteractive'}],
        },
        {
            code: /* HTML */ '<button type="button"><area href="/foo" /></button>',
            errors: [{data: {tag: 'button'}, messageId: 'noNestedInteractive'}],
        },
        {
            code: /* HTML */ '<button type="button"><details>More</details></button>',
            errors: [{data: {tag: 'button'}, messageId: 'noNestedInteractive'}],
        },
        {
            code: /* HTML */ '<button type="button"><div tabindex="0">Foo</div></button>',
            errors: [{data: {tag: 'button'}, messageId: 'noNestedInteractive'}],
        },
        {
            code: /* HTML */ '<button type="button">@if (shown) {<input type="text" />}</button>',
            errors: [{data: {tag: 'button'}, messageId: 'noNestedInteractive'}],
        },
        {
            code: /* HTML */ '<label><button type="button"><a href="/foo">Link</a></button></label>',
            errors: [{data: {tag: 'button'}, messageId: 'noNestedInteractive'}],
        },
        {
            code: /* HTML */ '<label><input type="text" /><button type="button">Action</button></label>',
            errors: [{data: {tag: 'label'}, messageId: 'noNestedInteractive'}],
        },
        {
            code: /* HTML */ '<label><label>Name</label></label>',
            errors: [{data: {tag: 'label'}, messageId: 'noNestedInteractive'}],
        },
    ],
    valid: [
        {code: /* HTML */ '<label>Name: <input type="text" /></label>'},
        {code: /* HTML */ '<button type="button"><input type="hidden" /></button>'},
        {code: /* HTML */ '<a><button type="button">Click me</button></a>'},
        {code: /* HTML */ '<div><button type="button">Click me</button></div>'},
        {code: /* HTML */ '<div (click)="onClick()">Click me</div>'},
        {
            code: /* HTML */ '<button type="button"><div (click)="onClick()">Foo</div></button>',
        },
        {
            code: /* HTML */ `
                <input
                    #input
                    (click)="onClick()"
                />
                @if (open) {
                <div
                    class="dropdown"
                    (mouseleave)="input.focus()"
                >
                    @for (item of items(); track item) {
                    <div
                        #option
                        tabindex="-1"
                        (click)="onSelect(item)"
                        (keydown.arrowDown.zoneless.prevent)="onArrowDown($index, $count)"
                        (mousemove.zoneless)="onMouseMove(option)"
                    >
                        {{ item }}
                    </div>
                    }
                </div>
                }
            `,
        },
        {
            code: /* HTML */ `
                <div (click)="onWrapper($any($event))">
                    <div (click.stop)="onStoppedClick()"></div>
                    <div (click.prevent)="onPreventedClick()"></div>
                    <div (click.zoneless)="onFilteredClicks($event.bubbles)"></div>
                </div>
                <div (click.capture.stop)="(0)">
                    <div (click)="onCaptured()"></div>
                </div>
                <div (click.self)="onBubbled()">
                    <div (click)="(0)"></div>
                </div>
                <div (click.debounce~300ms)="onDebounceClicks($event)"></div>
                <div (click.throttle~300ms)="onThrottleClicks($event)"></div>
            `,
        },
        {code: /* HTML */ '<div tabindex="0">Focusable</div>'},
        {code: /* HTML */ '<details>More</details>'},
        {code: /* HTML */ '<area href="/foo" />'},
        {code: /* HTML */ '<video controls></video>'},
        {code: /* HTML */ '<img usemap="#map" alt="Map" />'},
    ],
});
