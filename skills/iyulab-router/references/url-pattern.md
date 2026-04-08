# URL Pattern

## Supported Patterns

```ts
// Required
{ path: '/user/:id' }

// Optional
{ path: '/posts/:category?' }

// Wildcard
{ path: '/docs/:path*' }

// Multiple params
{ path: '/org/:orgId/repo/:repoId' }
```

Access params via `ctx.params`.

```ts
ctx.params.id;
ctx.params.category;
```

## Query and Hash

```ts
ctx.query.get('q');
ctx.query.get('page');
ctx.hash;
```
