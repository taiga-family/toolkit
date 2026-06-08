import {projectJsonExist} from './project-json-exist';

export function getDefaultParserOptions(): Record<string, unknown> {
    const tsconfig = projectJsonExist('tsconfig.eslint.json');

    if (tsconfig) {
        return {project: [tsconfig]};
    }

    return projectJsonExist('tsconfig.json')
        ? {
              projectService: true,
              tsconfigRootDir: process.cwd(),
          }
        : {projectService: false};
}
