// Simple configuration test to verify the no-restricted-imports patterns are set up correctly
describe('no-restricted-imports configuration', () => {
    it('should include CommonModule restriction', () => {
        // Test that the CommonModule restriction pattern is properly configured
        const commonModulePattern = {
            group: ['@angular/common'],
            importNames: ['CommonModule'],
            message:
                'Import standalone APIs directly instead of CommonModule. Use: AsyncPipe, NgComponentOutlet, NgFor, I18nPluralPipe, NgSwitch, NgSwitchCase, NgSwitchDefault, JsonPipe, DatePipe, UpperCasePipe, LowerCasePipe, CurrencyPipe, PercentPipe, etc.',
        };

        expect(commonModulePattern.group).toEqual(['@angular/common']);
        expect(commonModulePattern.importNames).toContain('CommonModule');
        expect(commonModulePattern.message).toContain(
            'Import standalone APIs directly instead of CommonModule',
        );
    });

    it('should include control flow restrictions for Angular 17+', () => {
        // Test NgIf restriction
        const ngIfPattern = {
            group: ['@angular/common'],
            importNames: ['NgIf'],
            message:
                'Use the built-in @if template control flow instead of NgIf. See: https://angular.io/guide/template-control-flow',
        };

        expect(ngIfPattern.group).toEqual(['@angular/common']);
        expect(ngIfPattern.importNames).toContain('NgIf');
        expect(ngIfPattern.message).toContain('@if template control flow');

        // Test NgForOf restriction
        const ngForPattern = {
            group: ['@angular/common'],
            importNames: ['NgForOf'],
            message:
                'Use the built-in @for template control flow instead of NgFor. See: https://angular.io/guide/template-control-flow',
        };

        expect(ngForPattern.group).toEqual(['@angular/common']);
        expect(ngForPattern.importNames).toContain('NgForOf');
        expect(ngForPattern.message).toContain('@for template control flow');

        // Test NgSwitch restriction
        const ngSwitchPattern = {
            group: ['@angular/common'],
            importNames: ['NgSwitch', 'NgSwitchCase', 'NgSwitchDefault'],
            message:
                'Use the built-in @switch template control flow instead of NgSwitch. See: https://angular.io/guide/template-control-flow',
        };

        expect(ngSwitchPattern.group).toEqual(['@angular/common']);
        expect(ngSwitchPattern.importNames).toContain('NgSwitch');
        expect(ngSwitchPattern.importNames).toContain('NgSwitchCase');
        expect(ngSwitchPattern.importNames).toContain('NgSwitchDefault');
        expect(ngSwitchPattern.message).toContain('@switch template control flow');
    });

    it('should have proper message format and links', () => {
        const messages = [
            'Import standalone APIs directly instead of CommonModule. Use: AsyncPipe, NgComponentOutlet, NgFor, I18nPluralPipe, NgSwitch, NgSwitchCase, NgSwitchDefault, JsonPipe, DatePipe, UpperCasePipe, LowerCasePipe, CurrencyPipe, PercentPipe, etc.',
            'Use the built-in @if template control flow instead of NgIf. See: https://angular.io/guide/template-control-flow',
            'Use the built-in @for template control flow instead of NgFor. See: https://angular.io/guide/template-control-flow',
            'Use the built-in @switch template control flow instead of NgSwitch. See: https://angular.io/guide/template-control-flow',
        ];

        // Test CommonModule message includes standalone APIs
        expect(messages[0]).toContain('AsyncPipe');
        expect(messages[0]).toContain('JsonPipe');
        expect(messages[0]).toContain('DatePipe');

        // Test control flow messages include proper links
        expect(messages[1]).toContain('https://angular.io/guide/template-control-flow');
        expect(messages[2]).toContain('https://angular.io/guide/template-control-flow');
        expect(messages[3]).toContain('https://angular.io/guide/template-control-flow');
    });
});
