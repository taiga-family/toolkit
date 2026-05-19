import {RuleTester} from 'eslint';

import {rule} from '../rules/recommended/no-nested-ternary-in-template';
import {withCrLf} from './utils/line-endings';

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@angular-eslint/template-parser')},
});

// noinspection AngularMissingRequiredDirectiveInputBinding
ruleTester.run('no-nested-ternary-in-template', rule, {
    invalid: [
        {
            code: /* HTML */ `
                <div
                    [appearance]="isActive() ? 'primary' : stepState() === 'error' ? 'negative' : 'secondary'"
                    [tuiAvatar]="avatarContent()"
                ></div>
            `,
            errors: [{messageId: 'noNestedTernaryInTemplate'}],
            output: /* HTML */ `
                @let appearance = stepState() === 'error' ? 'negative' : 'secondary';
                <div
                    [appearance]="isActive() ? 'primary' : appearance"
                    [tuiAvatar]="avatarContent()"
                ></div>
            `,
        },
        {
            code: /* HTML */ '<button [disabled]="loading() ? invalid() ? true : false : false"></button>',
            errors: [{messageId: 'noNestedTernaryInTemplate'}],
            output: /* HTML */ '@let disabled = invalid() ? true : false;\n<button [disabled]="loading() ? disabled : false"></button>',
        },
        {
            code: withCrLf(
                /* HTML */ '<button>\n{{ active ? label : fallback ? empty : title }}\n</button>',
            ),
            errors: [{messageId: 'noNestedTernaryInTemplate'}],
            output: withCrLf(
                /* HTML */ '<button>\n@let text = fallback ? empty : title;\n{{ active ? label : text }}\n</button>',
            ),
        },
        {
            code: /* HTML */ `
                <div
                    [appearance]="active ? 'primary' : error ? 'negative' : warning ? 'warning' : archived ? 'archived' : 'secondary'"
                    [tuiAvatar]="avatarContent()"
                ></div>
            `,
            errors: [
                {messageId: 'noNestedTernaryInTemplate'},
                {messageId: 'noNestedTernaryInTemplate'},
                {messageId: 'noNestedTernaryInTemplate'},
            ],
            output: `
                @let appearance3 = archived ? 'archived' : 'secondary';
                @let appearance2 = warning ? 'warning' : appearance3;
                @let appearance = error ? 'negative' : appearance2;
                <div
                    [appearance]="active ? 'primary' : appearance"
                    [tuiAvatar]="avatarContent()"
                ></div>
            `,
        },
        {
            code: /* HTML */ `
                <section>
                    <div *ngIf="visible ? ready : fallback ? true : false"></div>
                </section>
            `,
            errors: [{messageId: 'noNestedTernaryInTemplate'}],
            output: /* HTML */ `
                <section>
                    @let ngIf = fallback ? true : false;
                    <div *ngIf="visible ? ready : ngIf"></div>
                </section>
            `,
        },
        {
            code: /* HTML */ `
                <ng-template let-appearance>
                    <div
                        [appearance]="active ? 'primary' : state ? 'negative' : 'secondary'"
                        [tuiAvatar]="avatarContent()"
                    ></div>
                </ng-template>
            `,
            errors: [{messageId: 'noNestedTernaryInTemplate'}],
            output: /* HTML */ `
                <ng-template let-appearance>
                    @let appearance2 = state ? 'negative' : 'secondary';
                    <div
                        [appearance]="active ? 'primary' : appearance2"
                        [tuiAvatar]="avatarContent()"
                    ></div>
                </ng-template>
            `,
        },
        {
            code: /* HTML */ `
                <div
                    [appearance]="active ? 'primary' : error ? 'negative' : 'secondary'"
                    [tuiAvatar]="avatarContent()"
                ></div>

                @let appearance = fallbackAppearance();
            `,
            errors: [{messageId: 'noNestedTernaryInTemplate'}],
            output: /* HTML */ `
                @let appearance2 = error ? 'negative' : 'secondary';
                <div
                    [appearance]="active ? 'primary' : appearance2"
                    [tuiAvatar]="avatarContent()"
                ></div>

                @let appearance = fallbackAppearance();
            `,
        },
        {
            code: /* HTML */ `
                <div [state]="a ? 1 : b ? 2 : 3"></div>
                <div [state]="c ? 4 : d ? 5 : 6"></div>
            `,
            errors: [
                {messageId: 'noNestedTernaryInTemplate'},
                {messageId: 'noNestedTernaryInTemplate'},
            ],
            output: `
                @let state = b ? 2 : 3;
                <div [state]="a ? 1 : state"></div>
                @let state2 = d ? 5 : 6;
                <div [state]="c ? 4 : state2"></div>
            `,
        },
        {
            code: /* HTML */ "<div>{{ active ? 'active' : state === 'error' ? 'error' : 'idle' }}</div>",
            errors: [{messageId: 'noNestedTernaryInTemplate'}],
            output: /* HTML */ "<div>@let text = state === 'error' ? 'error' : 'idle';\n{{ active ? 'active' : text }}</div>",
        },
        {
            code: `
                <div>
                    {{ active ? 'active' : state === 'error' ? 'error' : 'idle' }}
                </div>
            `,
            errors: [{messageId: 'noNestedTernaryInTemplate'}],
            output: `
                <div>
                    @let text = state === 'error' ? 'error' : 'idle';
                    {{ active ? 'active' : text }}
                </div>
            `,
        },
        {
            code: /* HTML */ `
                <ng-template
                    #content
                    let-value
                >
                    {{ value === 's' ? 'Small' : value === 'm' ? 'Medium' : 'Large' }}
                </ng-template>
            `,
            errors: [{messageId: 'noNestedTernaryInTemplate'}],
            output: `
                <ng-template
                    #content
                    let-value
                >
                    @let text = value === 'm' ? 'Medium' : 'Large';
                    {{ value === 's' ? 'Small' : text }}
                </ng-template>
            `,
        },
        {
            code: `
                <h2
                    automation-id="tui-mobile-calendar__label"
                    class="t-label"
                >
                    {{ single() ? texts[0] : multi() ? texts[2] : texts[1] }}
                </h2>
            `,
            errors: [{messageId: 'noNestedTernaryInTemplate'}],
            output: `
                <h2
                    automation-id="tui-mobile-calendar__label"
                    class="t-label"
                >
                    @let text = multi() ? texts[2] : texts[1];
                    {{ single() ? texts[0] : text }}
                </h2>
            `,
        },
        {
            code: `
                <div>
                    {{ a ? 1 : b ? 2 : c ? 3 : 4 }}
                </div>
            `,
            errors: [
                {messageId: 'noNestedTernaryInTemplate'},
                {messageId: 'noNestedTernaryInTemplate'},
            ],
            output: `
                <div>
                    @let text2 = c ? 3 : 4;
                    @let text = b ? 2 : text2;
                    {{ a ? 1 : text }}
                </div>
            `,
        },
        {
            code: `
                <div>
                    {{ a ? 1 : b ? 2 : c ? 3 : d ? 4 : 5 }}
                </div>
            `,
            errors: [
                {messageId: 'noNestedTernaryInTemplate'},
                {messageId: 'noNestedTernaryInTemplate'},
                {messageId: 'noNestedTernaryInTemplate'},
            ],
            output: `
                <div>
                    @let text3 = d ? 4 : 5;
                    @let text2 = c ? 3 : text3;
                    @let text = b ? 2 : text2;
                    {{ a ? 1 : text }}
                </div>
            `,
        },
        {
            code: `
                <div>
                    @let text = someValue();
                    {{ a ? b : c ? d : e }}
                </div>
            `,
            errors: [{messageId: 'noNestedTernaryInTemplate'}],
            output: `
                <div>
                    @let text = someValue();
                    @let text2 = c ? d : e;
                    {{ a ? b : text2 }}
                </div>
            `,
        },
        {
            code: /* HTML */ '<button (click)="active ? save() : dirty ? confirm() : close()"></button>',
            errors: [{messageId: 'noNestedTernaryInTemplate'}],
        },
        {
            code: /* HTML */ "@let status = active ? 'active' : error ? 'error' : 'idle';",
            errors: [{messageId: 'noNestedTernaryInTemplate'}],
        },
    ],
    valid: [
        {
            code: /* HTML */ `
                @let appearance = stepState() === 'error' ? 'negative' : 'secondary';

                <div [appearance]="isActive() ? 'primary' : appearance"></div>
            `,
        },
        {
            code: /* HTML */ "<div [appearance]=\"isActive() ? 'primary' : 'secondary'\"></div>",
        },
        {
            code: /* HTML */ '<div [appearance]="appearance"></div>',
        },
        {
            code: `
                <div>
                    @let text = state === 'error' ? 'error' : 'idle';
                    {{ active ? 'active' : text }}
                </div>
            `,
        },
        {
            code: `
                <h2
                    automation-id="tui-mobile-calendar__label"
                    class="t-label"
                >
                    @let text = multi() ? texts[2] : texts[1];
                    {{ single() ? texts[0] : text }}
                </h2>
            `,
        },
    ],
});
