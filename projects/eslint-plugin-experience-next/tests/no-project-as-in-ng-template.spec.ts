import {RuleTester} from 'eslint';

import {rule} from '../rules/recommended/no-project-as-in-ng-template';

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@angular-eslint/template-parser')},
});

ruleTester.run('no-project-as-in-ng-template', rule, {
    invalid: [
        {
            code: /* HTML */ `
                <ng-container
                    *ngTemplateOutlet="banner"
                    ngProjectAs="tuiDocMobileNavigation"
                ></ng-container>
            `,
            errors: [{messageId: 'no-project-as-in-ng-template'}],
        },
        {
            code: /* HTML */ `
                <ng-container
                    *ngTemplateOutlet="tpl"
                    ngProjectAs="[someSlot]"
                />
            `,
            errors: [{messageId: 'no-project-as-in-ng-template'}],
        },
        {
            code: /* HTML */ `
                <ng-container
                    *ngComponentOutlet="MyComponent"
                    ngProjectAs="[someSlot]"
                ></ng-container>
            `,
            errors: [{messageId: 'no-project-as-in-ng-template'}],
        },
        {
            code: /* HTML */ `
                <ng-container
                    *polymorpheusOutlet="content"
                    ngProjectAs="someSlot"
                ></ng-container>
            `,
            errors: [{messageId: 'no-project-as-in-ng-template'}],
        },
        {
            code: /* HTML */ `
                <ng-container
                    [ngTemplateOutlet]="(items[key] && items[key].template) || plain"
                >
                    <ng-template #plain>
                        <td tuiTd>plain</td>
                    </ng-template>
                </ng-container>
            `,
            errors: [{messageId: 'no-nested-template-in-dynamic-outlet'}],
        },
    ],
    valid: [
        {
            code: /* HTML */ '<div ngProjectAs="[someSlot]">content</div>',
        },
        {
            code: /* HTML */ `
                <ng-container>
                    <div ngProjectAs="[someSlot]">content</div>
                </ng-container>
            `,
        },
        {
            code: /* HTML */ '<div *ngIf="condition" ngProjectAs="[someSlot]">content</div>',
        },
        {
            code: /* HTML */ '<ng-template ngProjectAs="[someSlot]"></ng-template>',
        },
        {
            code: /* HTML */ `
                <ng-template #tpl>
                    <div ngProjectAs="[someSlot]">content</div>
                </ng-template>
            `,
        },
        {
            code: /* HTML */ `
                <ng-template #tpl>
                    <span [ngProjectAs]="slotSelector">content</span>
                </ng-template>
            `,
        },
        {
            code: /* HTML */ `
                <ng-template #tpl>
                    <div class="content">no projection</div>
                </ng-template>
            `,
        },
        {
            code: /* HTML */ `
                <div
                    *ngFor="let item of items"
                    ngProjectAs="[someSlot]"
                >
                    {{ item }}
                </div>
            `,
        },
        {
            code: /* HTML */ `
                <div
                    *ngSwitchCase="'a'"
                    ngProjectAs="[someSlot]"
                >
                    A
                </div>
            `,
        },
        {
            code: /* HTML */ `
                <ng-container [ngTemplateOutlet]="tpl" />

                <ng-template #tpl>
                    <td tuiTd>plain</td>
                </ng-template>
            `,
        },
    ],
});
