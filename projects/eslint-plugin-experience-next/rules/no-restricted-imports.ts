export const TUI_NO_RESTRICTED_IMPORTS = [
    {
        group: ['rxjs/operators'],
        message: "Don't use 'rxjs/operators' instead of 'rxjs'",
    },
    {
        group: ['@angular/**'],
        importNames: ['Inject'],
        message: 'Please use `inject(Type)` function instead',
    },
    {
        group: ['@taiga-ui/polymorpheus'],
        importNames: ['POLYMORPHEUS_CONTEXT'],
        message: 'Please use `injectContext()` function instead',
    },
    {
        group: ['@angular/core'],
        importNames: ['Attribute'],
        message:
            'Always prefer using HostAttributeToken over @Attribute. See: https://angular.dev/api/core/HostAttributeToken',
    },
    {
        group: ['@angular/common'],
        importNames: ['CommonModule'],
        message:
            'Import standalone APIs directly instead of CommonModule. Use: AsyncPipe, NgComponentOutlet, NgFor, I18nPluralPipe, NgSwitch, NgSwitchCase, NgSwitchDefault, JsonPipe, DatePipe, UpperCasePipe, LowerCasePipe, CurrencyPipe, PercentPipe, etc.',
    },
];

export const TUI_NO_RESTRICTED_ANGULAR_MODERN_IMPORTS = [
    {
        group: ['@angular/common'],
        importNames: ['NgIf'],
        message:
            'Use the built-in @if template control flow instead of NgIf. See: https://angular.io/guide/template-control-flow',
    },
    {
        group: ['@angular/common'],
        importNames: ['NgForOf'],
        message:
            'Use the built-in @for template control flow instead of NgFor. See: https://angular.io/guide/template-control-flow',
    },
    {
        group: ['@angular/common'],
        importNames: ['NgSwitch', 'NgSwitchCase', 'NgSwitchDefault'],
        message:
            'Use the built-in @switch template control flow instead of NgSwitch. See: https://angular.io/guide/template-control-flow',
    },
];
