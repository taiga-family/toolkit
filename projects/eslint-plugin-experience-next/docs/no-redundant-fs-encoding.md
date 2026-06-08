# no-redundant-fs-encoding

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Reports redundant `encoding: 'utf8'` options and direct `'utf8'` encoding arguments in Node.js file write calls because
`writeFile`, `writeFileSync`, `appendFile`, and `appendFileSync` use utf8 by default when writing string data.

```ts
// ❌ error
writeFileSync(file, content, {encoding: 'utf8'});

writeFile(file, content, {encoding: 'utf-8'}, callback);

await fsPromises.writeFile(file, content, {encoding: 'UTF-8'});

appendFile(file, content, 'utf8', callback);

// ✅ after autofix
writeFileSync(file, content);

writeFile(file, content, callback);

await fsPromises.writeFile(file, content);

appendFile(file, content, callback);
```

```ts
// ❌ error
writeFileSync(file, content, {
  encoding: 'utf8',
  flag: 'wx',
});

// ✅ after autofix
writeFileSync(file, content, {
  flag: 'wx',
});
```

The rule does not report non-default or dynamic encodings:

```ts
// ✅ ok
writeFileSync(file, content, {encoding: 'base64'});
writeFileSync(file, content, 'base64');
writeFileSync(file, content, {encoding});
writeFileSync(file, content, encoding);
writeFileSync(file, content, {encoding: getEncoding()});
writeFileSync(file, content, getEncoding());
```
