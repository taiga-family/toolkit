function component(_metadata: unknown): ClassDecorator {
    return () => {};
}

@component({selector: 'test'})
export default class DecoratedDefault {}
