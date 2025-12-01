import rule from '../rules/standalone-imports-sort';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
        },
    },
});

ruleTester.run('standalone-imports-sort', rule, {
    invalid: [
        {
            code: `
                @Component({
                    standalone: true,
                    imports: [RouterModule, CommonModule, FormsModule]
                })
                class TestComponent {}
            `,
            errors: [
                {
                    message:
                        'Order in imports should be [CommonModule, FormsModule, RouterModule]',
                },
            ],
            output: `
                @Component({
                    standalone: true,
                    imports: [CommonModule, FormsModule, RouterModule]
                })
                class TestComponent {}
            `,
        },
        {
            code: `
                @Component({
                    imports: [RouterModule, CommonModule, FormsModule]
                })
                class TestComponent {}
            `,
            errors: [
                {
                    message:
                        'Order in imports should be [CommonModule, FormsModule, RouterModule]',
                },
            ],
            output: `
                @Component({
                    imports: [CommonModule, FormsModule, RouterModule]
                })
                class TestComponent {}
            `,
        },
        {
            code: `
                @Component({
                    standalone: true,
                    imports: [ZModule, AModule, BModule]
                })
                class TestComponent {}
            `,
            errors: [
                {
                    message: 'Order in imports should be [AModule, BModule, ZModule]',
                },
            ],
            output: `
                @Component({
                    standalone: true,
                    imports: [AModule, BModule, ZModule]
                })
                class TestComponent {}
            `,
        },
        {
            code: `
                @NgModule({
                    imports: [ZModule, AModule, BModule]
                })
                class Test {}
            `,
            errors: [
                {
                    message: 'Order in imports should be [AModule, BModule, ZModule]',
                },
            ],
            output: `
                @NgModule({
                    imports: [AModule, BModule, ZModule]
                })
                class Test {}
            `,
        },
        {
            code: `
                @Directive({
                    imports: [ZModule, AModule, BModule]
                })
                class Test {}
            `,
            errors: [
                {
                    message: 'Order in imports should be [AModule, BModule, ZModule]',
                },
            ],
            output: `
                @Directive({
                    imports: [AModule, BModule, ZModule]
                })
                class Test {}
            `,
        },
        {
            code: `
                @Pipe({
                    imports: [ZModule, AModule, BModule]
                })
                class Test {}
            `,
            errors: [
                {
                    message: 'Order in imports should be [AModule, BModule, ZModule]',
                },
            ],
            output: `
                @Pipe({
                    imports: [AModule, BModule, ZModule]
                })
                class Test {}
            `,
        },
        {
            code: `
                @Component({
                    imports: [
                        TuiStringifyContentPipe,
                        TuiLegacyDropdownOpenMonitorDirective,
                        ...TuiDropdown,
                        ...TuiDataList,
                        ...TuiDataListWrapper,
                    ]
                })
                class Test {}
            `,
            errors: [
                {
                    message:
                        'Order in imports should be [TuiLegacyDropdownOpenMonitorDirective, TuiStringifyContentPipe, ...TuiDataList, ...TuiDataListWrapper, ...TuiDropdown]',
                },
            ],
            output: `
                @Component({
                    imports: [TuiLegacyDropdownOpenMonitorDirective, TuiStringifyContentPipe, ...TuiDataList, ...TuiDataListWrapper, ...TuiDropdown]
                })
                class Test {}
            `,
        },
    ],
    valid: [
        {
            code: `
                class TestComponent {}
            `,
        },
        {
            code: `
                @Component({
                    selector: 'app-test'
                })
                class TestComponent {}
            `,
        },
        {
            code: `
                @Component({
                    standalone: true,
                    selector: 'app-test'
                })
                class TestComponent {}
            `,
        },
        {
            code: `
                @Component({
                    standalone: true,
                    imports: [CommonModule, FormsModule, RouterModule]
                })
                class TestComponent {}
            `,
        },
        {
            code: `
                @Component({
                    standalone: true,
                    imports: [CommonModule]
                })
                class TestComponent {}
            `,
        },
        {
            code: `
                @Component({
                    selector: 'app-test',
                    imports: [CommonModule]
                })
                class TestComponent {}
            `,
        },
        {
            code: `
                @Component({
                    standalone: true,
                    imports: [
                        TuiDataList,
                        TuiDropdown,
                        TuiFeedItemActionComponent,
                        TuiFeedItemDetailsComponent,
                        , // possible trailing comma
                        TuiItemsWithMore,
                        TuiTimelineStepComponent,
                        TuiTimelineStepDirective,
                        TuiTimelineStepsComponent,
                        TuiTitle,
                    ],
                    templateUrl: './index.html',
                    styleUrl: './index.less',
                    encapsulation,
                    changeDetection,
                })
                class TestComponent {}
            `,
        },
    ],
});
