import {type Rule} from '@angular-devkit/schematics';

const TUI_ICON_TAG_REGEXP = /<tui-icon\b[^>]*>/gi;
const BADGE_ATTRIBUTE_REGEXP = /\s\[*tuiBadge(?:\]|\b)(?=[\s=>])/i;
const ICON_ATTRIBUTE_REPLACE_REGEXP = /(\s)icon(?==)/g;
const ICON_INPUT_REPLACE_REGEXP = /(\s)\[icon\](?==)/g;

export function replaceTuiIconBadge(): Rule {
    return (tree) => {
        tree.visit((path) => {
            if (!path.endsWith('.html')) {
                return;
            }

            const buffer = tree.read(path);

            if (!buffer) {
                return;
            }

            const content = buffer.toString('utf8');
            const migrated = migrateTemplate(content);

            if (migrated !== content) {
                tree.overwrite(path, migrated);
            }
        });

        return tree;
    };
}

export function migrateTemplate(template: string): string {
    return template.replaceAll(TUI_ICON_TAG_REGEXP, (iconTag) => {
        if (!BADGE_ATTRIBUTE_REGEXP.test(iconTag)) {
            return iconTag;
        }

        let updated = iconTag;

        updated = updated.replaceAll(
            ICON_ATTRIBUTE_REPLACE_REGEXP,
            (match, whitespace: string) => {
                return `${whitespace}iconStart`;
            },
        );

        updated = updated.replaceAll(
            ICON_INPUT_REPLACE_REGEXP,
            (match, whitespace: string) => {
                return `${whitespace}[iconStart]`;
            },
        );

        return updated;
    });
}
