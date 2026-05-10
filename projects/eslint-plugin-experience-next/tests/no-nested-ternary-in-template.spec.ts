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
            output: /* HTML */ '@let disabled = invalid() ? true : false;\n\n<button [disabled]="loading() ? disabled : false"></button>',
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
            code: /* HTML */ "<div>{{ active ? 'active' : state === 'error' ? 'error' : 'idle' }}</div>",
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
            code: /* HTML */ '<button (click)="active ? save() : dirty ? confirm() : close()"></button>',
        },
        {
            code: /* HTML */ '<div [appearance]="appearance"></div>',
        },
    ],
});
