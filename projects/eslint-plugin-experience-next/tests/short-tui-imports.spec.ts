import {MESSAGE_ID, rule} from '../rules/short-tui-imports.ts';

const {RuleTester} = require('@typescript-eslint/rule-tester');

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {ecmaVersion: 2020, sourceType: 'module'},
    },
});

ruleTester.run('short-tui-imports', rule, {
    invalid: [
        {
            code: `
                import {Component} from '@angular/core';
                import {TuiDataListComponent} from '@taiga-ui/kit';

                @Component({
                    imports: [TuiDataListComponent],
                })
                export class TestComponent {}
            `,
            errors: [{messageId: MESSAGE_ID}],
            output: `
                import {Component} from '@angular/core';
                import { TuiDataList } from '@taiga-ui/kit';

                @Component({
                    imports: [TuiDataList],
                })
                export class TestComponent {}
            `,
        },
        {
            code: `
                import {TuiDataListComponent, TuiButtonComponent} from '@taiga-ui/kit';

                @Component({
                    imports: [TuiDataListComponent, TuiButtonComponent],
                })
                export class Example {
                    readonly component = inject(TuiDataListComponent);
                }
            `,
            errors: [{messageId: MESSAGE_ID}, {messageId: MESSAGE_ID}],
            output: [
                `
                import { TuiButtonComponent, TuiDataList, TuiDataListComponent } from '@taiga-ui/kit';

                @Component({
                    imports: [TuiDataList, TuiButtonComponent],
                })
                export class Example {
                    readonly component = inject(TuiDataListComponent);
                }
            `,
                `
                import { TuiButton, TuiDataList, TuiDataListComponent } from '@taiga-ui/kit';

                @Component({
                    imports: [TuiDataList, TuiButton],
                })
                export class Example {
                    readonly component = inject(TuiDataListComponent);
                }
            `,
            ],
        },
        {
            code: `
                import {TuiDataListComponent, TuiButtonComponent} from '@taiga-ui/kit';

                @Component({
                    imports: [TuiDataListComponent, TuiButtonComponent],
                })
                export class Example {
                    readonly a = inject(TuiDataListComponent);
                    readonly b = inject(TuiButtonComponent);
                }
            `,
            errors: [{messageId: MESSAGE_ID}, {messageId: MESSAGE_ID}],
            output: [
                `
                import { TuiButtonComponent, TuiDataList, TuiDataListComponent } from '@taiga-ui/kit';

                @Component({
                    imports: [TuiDataList, TuiButtonComponent],
                })
                export class Example {
                    readonly a = inject(TuiDataListComponent);
                    readonly b = inject(TuiButtonComponent);
                }
            `,
                `
                import { TuiButton, TuiButtonComponent, TuiDataList, TuiDataListComponent } from '@taiga-ui/kit';

                @Component({
                    imports: [TuiDataList, TuiButton],
                })
                export class Example {
                    readonly a = inject(TuiDataListComponent);
                    readonly b = inject(TuiButtonComponent);
                }
            `,
            ],
        },
        {
            code: `
                import {TuiDataListComponent, TuiButtonComponent} from '@taiga-ui/kit';

                @Component({
                    imports: [TuiDataListComponent, TuiButtonComponent],
                })
                export class Example {}
            `,
            errors: [{messageId: MESSAGE_ID}, {messageId: MESSAGE_ID}],
            output: [
                `
                import { TuiButtonComponent, TuiDataList } from '@taiga-ui/kit';

                @Component({
                    imports: [TuiDataList, TuiButtonComponent],
                })
                export class Example {}
            `,
                `
                import { TuiButton, TuiDataList } from '@taiga-ui/kit';

                @Component({
                    imports: [TuiDataList, TuiButton],
                })
                export class Example {}
            `,
            ],
        },
        {
            code: `
                import {TuiDataListComponent, TuiActiveZoneDirective} from '@taiga-ui/kit';

                @Directive({
                    imports: [TuiDataListComponent, TuiActiveZoneDirective],
                })
                export class MyDir {}
            `,
            errors: [{messageId: MESSAGE_ID}, {messageId: MESSAGE_ID}],
            output: [
                `
                import { TuiActiveZoneDirective, TuiDataList } from '@taiga-ui/kit';

                @Directive({
                    imports: [TuiDataList, TuiActiveZoneDirective],
                })
                export class MyDir {}
            `,
                `
                import { TuiActiveZone, TuiDataList } from '@taiga-ui/kit';

                @Directive({
                    imports: [TuiDataList, TuiActiveZone],
                })
                export class MyDir {}
            `,
            ],
        },
        {
            code: `
                import { type TuiDataListComponent, TuiButtonComponent } from '@taiga-ui/kit';

                @Component({
                    imports: [TuiButtonComponent],
                })
                export class TestComponent {}
            `,
            errors: [{messageId: MESSAGE_ID}],
            output: `
                import { type TuiDataListComponent, TuiButton } from '@taiga-ui/kit';

                @Component({
                    imports: [TuiButton],
                })
                export class TestComponent {}
            `,
        },
        {
            code: `
                import {TuiDataListComponent, TuiButtonComponent} from '@taiga-ui/kit';
                import {TuiAnywayComponent} from '@taiga-ui/anyway';

                @Component({
                    imports: [TuiDataListComponent],
                })
                export class A {}

                @Directive({
                    imports: [TuiButtonComponent],
                })
                export class B {}
                
                @NgModule({
                    imports: [TuiAnywayComponent],
                })
                export class C {}
            `,
            errors: [
                {messageId: MESSAGE_ID},
                {messageId: MESSAGE_ID},
                {messageId: MESSAGE_ID},
            ],
            output: [
                `
                import { TuiButtonComponent, TuiDataList } from '@taiga-ui/kit';
                import {TuiAnywayComponent} from '@taiga-ui/anyway';

                @Component({
                    imports: [TuiDataList],
                })
                export class A {}

                @Directive({
                    imports: [TuiButtonComponent],
                })
                export class B {}
                
                @NgModule({
                    imports: [TuiAnywayComponent],
                })
                export class C {}
            `,
                `
                import { TuiButton, TuiDataList } from '@taiga-ui/kit';
                import {TuiAnywayComponent} from '@taiga-ui/anyway';

                @Component({
                    imports: [TuiDataList],
                })
                export class A {}

                @Directive({
                    imports: [TuiButton],
                })
                export class B {}
                
                @NgModule({
                    imports: [TuiAnywayComponent],
                })
                export class C {}
            `,
                `
                import { TuiButton, TuiDataList } from '@taiga-ui/kit';
                import { TuiAnyway } from '@taiga-ui/anyway';

                @Component({
                    imports: [TuiDataList],
                })
                export class A {}

                @Directive({
                    imports: [TuiButton],
                })
                export class B {}
                
                @NgModule({
                    imports: [TuiAnyway],
                })
                export class C {}
            `,
            ],
        },
        {
            code: `
                import { TuiTextfieldOptionsDirective, TuiButtonComponent } from '@taiga-ui/kit';

                @Component({
                  imports: [TuiTextfieldOptionsDirective, TuiButtonComponent],
                })
                export class Example {}
            `,
            errors: [{messageId: MESSAGE_ID}, {messageId: MESSAGE_ID}],
            output: [
                `
                import { TuiButtonComponent, TuiTextfield } from '@taiga-ui/kit';

                @Component({
                  imports: [TuiTextfield, TuiButtonComponent],
                })
                export class Example {}
            `,
                `
                import { TuiButton, TuiTextfield } from '@taiga-ui/kit';

                @Component({
                  imports: [TuiTextfield, TuiButton],
                })
                export class Example {}
            `,
            ],
        },
        {
            code: `
                import { TuiPreviewDialogDirective } from '@taiga-ui/kit';

                @Component({
                  imports: [TuiPreviewDialogDirective],
                })
                export class Example {}
            `,
            errors: [{messageId: MESSAGE_ID}],
            output: `
                import { TuiPreview } from '@taiga-ui/kit';

                @Component({
                  imports: [TuiPreview],
                })
                export class Example {}
            `,
        },
        {
            code: `
                import { TuiPreviewDialogDirective } from '@taiga-ui/kit';

                @Component({
                  imports: [TuiPreviewDialogDirective],
                })
                export class Example {
                    readonly preview = inject(TuiPreviewDialogDirective);
                }
            `,
            errors: [{messageId: MESSAGE_ID}],
            output: `
                import { TuiPreview, TuiPreviewDialogDirective } from '@taiga-ui/kit';

                @Component({
                  imports: [TuiPreview],
                })
                export class Example {
                    readonly preview = inject(TuiPreviewDialogDirective);
                }
            `,
        },
        {
            code: `
               import {TuiPreview, TuiPreviewDialogDirective} from '@taiga-ui/kit';
               
               @Component({
                  imports: [TuiPreview, TuiPreviewDialogDirective],
                })
                export class Example {}
            `,
            errors: [{messageId: MESSAGE_ID}],
            output: `
               import { TuiPreview } from '@taiga-ui/kit';
               
               @Component({
                  imports: [TuiPreview, ],
                })
                export class Example {}
            `,
        },
    ],
    valid: [
        {
            code: `
                import {TuiDataListComponent} from '@taiga-ui/kit';

                const refs = [TuiDataListComponent];
            `,
        },
        {
            code: `
                import {TuiDataList} from '@taiga-ui/kit';

                @Component({
                    imports: [TuiDataList],
                })
                export class TestComponent {}
           `,
        },
        {
            code: `
            import {MyComponent} from './local';

            @Component({
                imports: [MyComponent],
            })
            export class TestComponent {}
           `,
        },
    ],
});
