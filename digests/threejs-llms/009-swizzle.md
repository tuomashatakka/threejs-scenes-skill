## Swizzle

Swizzling is the technique that allows you to access, reorder, or duplicate the components of a vector using a specific notation within TSL. This is done by combining the identifiers:

```js
const original = vec3( 1.0, 2.0, 3.0 ); // (x, y, z)
const swizzled = original.zyx; // swizzled = (3.0, 2.0, 1.0)
```

It's possible use `xyzw`, `rgba` or `stpq`.
