import {type ClassMember, getEnclosingClass} from '../ast/ancestors';
import {getClassMemberName} from '../ast/property-names';
import {hasNamedDecorator} from '../typescript/decorators';

export function isPipeTransformMember(member: ClassMember): boolean {
    if (getClassMemberName(member) !== 'transform') {
        return false;
    }

    const ownerClass = getEnclosingClass(member);

    return !!ownerClass && hasNamedDecorator(ownerClass, 'Pipe');
}
