import {RuleTester} from 'eslint';

import {rule} from '../rules/recommended/no-nested-ternary-in-template';

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@angular-eslint/template-parser')},
});

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
    ],
});
