# Faça um cópia do directus para localhost

```console
npx directus-migrator -s cidadet -t localhost
```

https://www.npmjs.com/package/directus-migrator

## Eis o segredo para funcionar

```console
CONTENT_SECURITY_POLICY_DIRECTIVES: json:{"defaultSrc":["'self'"] , "scriptSrc":["'self'","'unsafe-eval'","'unsafe-inline'","cdnjs.cloudflare.com"], "defaultSrc":["'self'","'unsafe-eval'","'unsafe-inline'","cdnjs.cloudflare.com"], "objectSrc":["'self'","'unsafe-eval'","'unsafe-inline'","cdnjs.cloudflare.com"],"workerSrc":["'self'","blob:","'unsafe-eval'","'unsafe-inline'","cdnjs.cloudflare.com"],"connectSrc":["'self'","blob:","'unsafe-eval'","'unsafe-inline'","google-analytics.com"],"scriptSrcElem":null}
```
