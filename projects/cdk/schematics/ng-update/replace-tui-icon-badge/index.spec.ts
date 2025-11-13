import {Tree} from '@angular-devkit/schematics';
import {SchematicTestRunner, UnitTestTree} from '@angular-devkit/schematics/testing';

const collectionPath = require.resolve('../collection.json');

describe('replace-tui-icon-badge schematic', () => {
    const runner = new SchematicTestRunner('ng-update', collectionPath);

    async function runMigration(template: string): Promise<string> {
        const tree = new UnitTestTree(Tree.empty());

        tree.create('/app/app.component.html', template);

        const result = await runner.runSchematic('replace-tui-icon-badge', {}, tree);

        return result.readContent('/app/app.component.html');
    }

    it('replaces icon attribute with iconStart when tuiBadge is present', async () => {
        const migrated = await runMigration('<tui-icon tuiBadge icon="tuiIconClose"></tui-icon>');

        expect(migrated).toBe('<tui-icon tuiBadge iconStart="tuiIconClose"></tui-icon>');
    });

    it('replaces [icon] binding with [iconStart]', async () => {
        const migrated = await runMigration('<tui-icon [tuiBadge]="true" [icon]="icon"></tui-icon>');

        expect(migrated).toBe('<tui-icon [tuiBadge]="true" [iconStart]="icon"></tui-icon>');
    });

    it('does not touch icons without tuiBadge directive', async () => {
        const template = '<tui-icon icon="tuiIconClose"></tui-icon>';
        const migrated = await runMigration(template);

        expect(migrated).toBe(template);
    });
});
