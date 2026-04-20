interface ObsoleteAttrConfig {
    readonly elements: readonly string[];
    readonly suggestion: string;
}

export const OBSOLETE_HTML_ATTRS: Record<string, readonly ObsoleteAttrConfig[]> = {
    abbr: [
        {
            elements: ['td'],
            suggestion:
                "Use text that begins in an unambiguous and terse manner, and include any more elaborate text after that. The title attribute can also be useful in including more detailed text, so that the cell's contents can be made terse. If it's a heading, use th (which has an abbr attribute).",
        },
    ],
    accept: [
        {
            elements: ['form'],
            suggestion:
                'Use the accept attribute directly on the input elements instead.',
        },
    ],
    align: [
        {
            elements: [
                'caption',
                'col',
                'div',
                'embed',
                'h1',
                'h2',
                'h3',
                'h4',
                'h5',
                'h6',
                'hr',
                'iframe',
                'input',
                'img',
                'legend',
                'object',
                'p',
                'table',
                'tbody',
                'thead',
                'tfoot',
                'td',
                'th',
                'tr',
            ],
            suggestion: 'Use CSS instead.',
        },
    ],
    alink: [{elements: ['body'], suggestion: 'Use CSS instead.'}],
    allowtransparency: [{elements: ['iframe'], suggestion: 'Use CSS instead.'}],
    archive: [
        {
            elements: ['object'],
            suggestion: 'Use the data and type attributes to invoke plugins.',
        },
    ],
    axis: [
        {
            elements: ['td', 'th'],
            suggestion: 'Use the scope attribute on the relevant th.',
        },
    ],
    background: [
        {
            elements: ['body', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th'],
            suggestion: 'Use CSS instead.',
        },
    ],
    bgcolor: [
        {
            elements: ['body', 'table', 'td', 'th', 'tr'],
            suggestion: 'Use CSS instead.',
        },
    ],
    border: [
        {
            elements: ['input', 'img', 'object', 'table'],
            suggestion: 'Use CSS instead.',
        },
    ],
    bordercolor: [{elements: ['table'], suggestion: 'Use CSS instead.'}],
    bottommargin: [{elements: ['body'], suggestion: 'Use CSS instead.'}],
    cellpadding: [{elements: ['table'], suggestion: 'Use CSS instead.'}],
    cellspacing: [{elements: ['table'], suggestion: 'Use CSS instead.'}],
    char: [
        {
            elements: ['col', 'tbody', 'thead', 'tfoot', 'td', 'th', 'tr'],
            suggestion: 'Use CSS instead.',
        },
    ],
    charoff: [
        {
            elements: ['col', 'tbody', 'thead', 'tfoot', 'td', 'th', 'tr'],
            suggestion: 'Use CSS instead.',
        },
    ],
    charset: [
        {
            elements: ['a', 'link'],
            suggestion:
                'Use an HTTP `Content-Type` header on the linked resource instead.',
        },
        {
            elements: ['script'],
            suggestion:
                'It is redundant to specify it on the script element since it inherits from the document.',
        },
    ],
    classid: [
        {
            elements: ['object'],
            suggestion: 'Use the data and type attributes to invoke plugins.',
        },
    ],
    clear: [{elements: ['br'], suggestion: 'Use CSS instead.'}],
    code: [
        {
            elements: ['object'],
            suggestion: 'Use the data and type attributes to invoke plugins.',
        },
    ],
    codebase: [
        {
            elements: ['object'],
            suggestion: 'Use the data and type attributes to invoke plugins.',
        },
    ],
    codetype: [
        {
            elements: ['object'],
            suggestion: 'Use the data and type attributes to invoke plugins.',
        },
    ],
    color: [{elements: ['hr'], suggestion: 'Use CSS instead.'}],
    compact: [
        {
            elements: ['dl', 'menu', 'ol', 'ul'],
            suggestion: 'Use CSS instead.',
        },
    ],
    contextmenu: [
        {
            elements: ['*'],
            suggestion:
                'To implement a custom context menu, use script to handle the contextmenu event.',
        },
    ],
    coords: [{elements: ['a'], suggestion: 'Use area instead of a for image maps.'}],
    datafld: [
        {
            elements: [
                'a',
                'button',
                'div',
                'fieldset',
                'frame',
                'iframe',
                'img',
                'input',
                'label',
                'legend',
                'marquee',
                'object',
                'select',
                'span',
                'textarea',
            ],
            suggestion:
                'Use script and a mechanism such as XMLHttpRequest to populate the page dynamically.',
        },
    ],
    dataformatas: [
        {
            elements: [
                'button',
                'div',
                'input',
                'label',
                'legend',
                'marquee',
                'object',
                'option',
                'select',
                'span',
                'table',
            ],
            suggestion:
                'Use script and a mechanism such as XMLHttpRequest to populate the page dynamically.',
        },
    ],
    datapagesize: [
        {
            elements: ['table'],
            suggestion: 'Unnecessary. Omit it altogether.',
        },
    ],
    datasrc: [
        {
            elements: [
                'a',
                'button',
                'div',
                'frame',
                'iframe',
                'img',
                'input',
                'label',
                'legend',
                'marquee',
                'object',
                'option',
                'select',
                'span',
                'table',
                'textarea',
            ],
            suggestion:
                'Use script and a mechanism such as XMLHttpRequest to populate the page dynamically.',
        },
    ],
    declare: [
        {
            elements: ['object'],
            suggestion:
                'Repeat the object element completely each time the resource is to be reused.',
        },
    ],
    dropzone: [
        {
            elements: ['*'],
            suggestion: 'Use script to handle the dragenter and dragover events instead.',
        },
    ],
    event: [
        {
            elements: ['script'],
            suggestion: 'Use DOM events mechanisms to register event listeners.',
        },
    ],
    for: [
        {
            elements: ['script'],
            suggestion: 'Use DOM events mechanisms to register event listeners.',
        },
    ],
    frame: [{elements: ['table'], suggestion: 'Use CSS instead.'}],
    frameborder: [{elements: ['iframe'], suggestion: 'Use CSS instead.'}],
    framespacing: [{elements: ['iframe'], suggestion: 'Use CSS instead.'}],
    height: [
        {
            elements: ['table', 'thead', 'tbody', 'tfoot', 'td', 'th', 'tr'],
            suggestion: 'Use CSS instead.',
        },
    ],
    hreflang: [
        {
            elements: ['area'],
            suggestion:
                'These attributes do not do anything useful, and for historical reasons there are no corresponding IDL attributes on area elements. Omit them altogether.',
        },
    ],
    hspace: [
        {
            elements: ['embed', 'iframe', 'input', 'img', 'object'],
            suggestion: 'Use CSS instead.',
        },
    ],
    ismap: [
        {
            elements: ['input'],
            suggestion:
                'Unnecessary. Omit it altogether. All input elements with a type attribute in the Image Button state are processed as server-side image maps.',
        },
    ],
    label: [
        {
            elements: ['menu'],
            suggestion:
                'To implement a custom context menu, use script to handle the contextmenu event.',
        },
    ],
    language: [
        {
            elements: ['script'],
            suggestion:
                'Omit the attribute for JavaScript; for data blocks, use the type attribute instead.',
        },
    ],
    leftmargin: [{elements: ['body'], suggestion: 'Use CSS instead.'}],
    link: [{elements: ['body'], suggestion: 'Use CSS instead.'}],
    longdesc: [
        {
            elements: ['iframe', 'img'],
            suggestion:
                "Use a regular a element to link to the description, or (in the case of images) use an image map to provide a link from the image to the image's description.",
        },
    ],
    lowsrc: [
        {
            elements: ['img'],
            suggestion:
                'Use a progressive JPEG image (given in the src attribute), instead of using two separate images.',
        },
    ],
    manifest: [{elements: ['html'], suggestion: 'Use service workers instead.'}],
    marginheight: [
        {
            elements: ['body', 'iframe'],
            suggestion: 'Use CSS instead.',
        },
    ],
    marginwidth: [
        {
            elements: ['body', 'iframe'],
            suggestion: 'Use CSS instead.',
        },
    ],
    methods: [
        {
            elements: ['a', 'link'],
            suggestion: 'Use the HTTP OPTIONS feature instead.',
        },
    ],
    name: [
        {
            elements: ['a', 'embed', 'img', 'option'],
            suggestion: 'Use the id attribute instead.',
        },
    ],
    nohref: [
        {
            elements: ['area'],
            suggestion:
                'Omitting the href attribute is sufficient; the nohref attribute is unnecessary. Omit it altogether.',
        },
    ],
    noshade: [{elements: ['hr'], suggestion: 'Use CSS instead.'}],
    nowrap: [{elements: ['td', 'th'], suggestion: 'Use CSS instead.'}],
    onshow: [
        {
            elements: ['*'],
            suggestion:
                'To implement a custom context menu, use script to handle the contextmenu event.',
        },
    ],
    profile: [{elements: ['head'], suggestion: 'Unnecessary. Omit it altogether.'}],
    rev: [
        {
            elements: ['a', 'link'],
            suggestion:
                'Use the rel attribute instead, with an opposite term. (For example, instead of rev="made", use rel="author".)',
        },
    ],
    rightmargin: [{elements: ['body'], suggestion: 'Use CSS instead.'}],
    scheme: [
        {
            elements: ['meta'],
            suggestion:
                'Use only one scheme per field, or make the scheme declaration part of the value.',
        },
    ],
    scope: [
        {
            elements: ['td'],
            suggestion: 'Use th elements for heading cells.',
        },
    ],
    scrolling: [{elements: ['iframe'], suggestion: 'Use CSS instead.'}],
    shape: [{elements: ['a'], suggestion: 'Use area instead of a for image maps.'}],
    size: [{elements: ['hr'], suggestion: 'Use CSS instead.'}],
    standby: [
        {
            elements: ['object'],
            suggestion:
                'Optimize the linked resource so that it loads quickly or, at least, incrementally.',
        },
    ],
    summary: [
        {
            elements: ['table'],
            suggestion:
                'Use one of the techniques for describing tables given in the table section instead.',
        },
    ],
    target: [{elements: ['link'], suggestion: 'Unnecessary. Omit it altogether.'}],
    text: [{elements: ['body'], suggestion: 'Use CSS instead.'}],
    topmargin: [{elements: ['body'], suggestion: 'Use CSS instead.'}],
    type: [
        {
            elements: ['area'],
            suggestion:
                'These attributes do not do anything useful, and for historical reasons there are no corresponding IDL attributes on area elements. Omit them altogether.',
        },
        {elements: ['li'], suggestion: 'Use CSS instead.'},
        {
            elements: ['menu'],
            suggestion:
                'To implement a custom context menu, use script to handle the contextmenu event. For toolbar menus, omit the attribute.',
        },
        {
            elements: ['style'],
            suggestion:
                'Omit the attribute for CSS; for data blocks, use script as the container instead of style.',
        },
        {elements: ['ul'], suggestion: 'Use CSS instead.'},
    ],
    typemustmatch: [
        {
            elements: ['object'],
            suggestion: 'Avoid using object elements with untrusted resources.',
        },
    ],
    urn: [
        {
            elements: ['a', 'link'],
            suggestion:
                'Specify the preferred persistent identifier using the href attribute instead.',
        },
    ],
    usemap: [
        {
            elements: ['input', 'object'],
            suggestion: 'Use the img element for image maps.',
        },
    ],
    valign: [
        {
            elements: ['col', 'tbody', 'thead', 'tfoot', 'td', 'th', 'tr'],
            suggestion: 'Use CSS instead.',
        },
    ],
    version: [{elements: ['html'], suggestion: 'Unnecessary. Omit it altogether.'}],
    vlink: [{elements: ['body'], suggestion: 'Use CSS instead.'}],
    vspace: [
        {
            elements: ['embed', 'iframe', 'input', 'img', 'object'],
            suggestion: 'Use CSS instead.',
        },
    ],
    width: [
        {
            elements: ['col', 'hr', 'pre', 'table', 'td', 'th'],
            suggestion: 'Use CSS instead.',
        },
    ],
    rules: [{elements: ['table'], suggestion: 'Use CSS instead.'}],
};
