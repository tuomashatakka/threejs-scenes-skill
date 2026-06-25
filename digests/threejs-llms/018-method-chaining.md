## Method chaining

`Method chaining` will only be including operators, converters, math and some core functions. These functions, however, can be used on any `node`.

Example:

`oneMinus()` is a mathematical function like `abs()`, `sin()`. This example uses `.oneMinus()` as a built-in function in the class that returns a new node instead of classic C function like `oneMinus( texture( map ).rgb )`.

```js
// it will invert the texture color
material.colorNode = texture( map ).rgb.oneMinus();
```

You can use mathematical operators on any node, e.g:

```js
const contrast = .5;
const brightness = .5;

material.colorNode = texture( map ).mul( contrast ).add( brightness );
```
