export function getTypeName(param: any): any {
    const typeAnnotation = param?.parameter?.typeAnnotation ?? param?.typeAnnotation;

    return typeAnnotation?.typeAnnotation?.typeName?.name;
}
