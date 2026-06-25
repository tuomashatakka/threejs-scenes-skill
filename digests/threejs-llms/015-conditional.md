## Conditional

### If-else

`If-else` conditionals can be used within `Fn()`. Conditionals in `TSL` are built using the `If` function:

```js
If( conditional, function )
.ElseIf( conditional, function )
.Else( function )
```
> Notice here the `i` in `If` is capitalized.

Example:

In this example below, we will limit the y position of the geometry to 10.

```js
const limitPosition = Fn( ( { position } ) => {

	const limit = 10;

	const result = vec3( position );

	If( result.y.greaterThan( limit ), () => {

		result.y = limit;

	} );

	return result;

} );

material.positionNode = limitPosition( { position: positionLocal } );
```

Example using `elseif`:

```js
const limitPosition = Fn( ( { position } ) => {

	const limit = 10;

	const result = vec3( position );

	If( result.y.greaterThan( limit ), () => {

		result.y = limit;

	} ).ElseIf( result.y.lessThan( limit ), () => {

		result.y = limit;

	} );

	return result;

} );

material.positionNode = limitPosition( { position: positionLocal } );
```
### Switch-Case

A Switch-Case statement is an alternative way to express conditional logic compared to If-Else.

```js
const col = color();

Switch( 0 )
	.Case( 0, () => {

		col.assign( color( 1, 0, 0 ) );

	} ).Case( 1, () => {

		col.assign( color( 0, 1, 0 ) );

	} ).Case( 2, 3, () => {

		col.assign( color( 0, 0, 1 ) );

	} ).Default( () => {

		col.assign( color( 1, 1, 1 ) );

	} );
```
Notice that there are some rules when using this syntax which differentiate TSL from JavaScript:

- There is no fallthrough support. So each `Case()` statement has an implicit break.
- A `Case()` statement can hold multiple values (selectors) for testing. 

### Ternary

Different from `if-else`, a ternary conditional will return a value and can be used outside of `Fn()`.

```js
const result = select( value.greaterThan( 1 ), 1.0, value );
```
> Equivalent in JavaScript should be: `value > 1 ? 1.0 : value`
