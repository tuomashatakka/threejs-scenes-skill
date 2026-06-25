## Function

### `Fn( function, layout = null )`

It is possible to use classic JS functions or a `Fn()` interface. The main difference is that `Fn()` creates a controllable environment, allowing the use of `stack` where you can use `assign` and `conditional`, while the classic function only allows inline approaches.

Example:

```js
// tsl function
const oscSine = Fn( ( [ t = time ] ) => {

	return t.add( 0.75 ).mul( Math.PI * 2 ).sin().mul( 0.5 ).add( 0.5 );

} );

// inline function
export const oscSine = ( t = time ) => t.add( 0.75 ).mul( Math.PI * 2 ).sin().mul( 0.5 ).add( 0.5 );
```
> Both above can be called with `oscSin( value )`.

TSL allows the entry of parameters as object, this is useful in functions that have many optional arguments.

Example:

```js
const oscSine = Fn( ( { timer = time } ) => {

	return timer.add( 0.75 ).mul( Math.PI * 2 ).sin().mul( 0.5 ).add( 0.5 );

} );

const value = oscSine( { timer: value } );
```

Parameters as object also allows traditional calls as an array, enabling different types of usage.

```js
const col = Fn( ( { r, g, b } ) => {

	return vec3( r, g, b );

} );


// Any of the options below will return a green color.

material.colorNode = col( 0, 1, 0 ); // option 1
material.colorNode = col( { r: 0, g: 1, b: 0 } ); // option 2
```

If you want to use an export function compatible with `tree shaking`, remember to use `/*@__PURE__*/`

```js
export const oscSawtooth = /*@__PURE__*/ Fn( ( [ timer = time ] ) => timer.fract() );
```

The second parameter of the function, if there are any parameters, will always be the first if there are none, and is dedicated to `NodeBuilder`. In `NodeBuilder` you can find out details about the current construction process and also obtain objects related to the shader construction, such as `material`, `geometry`, `object`, `camera`, etc.

[See an example](#deferred-function-high-level-of-customization-goodby-defines)
