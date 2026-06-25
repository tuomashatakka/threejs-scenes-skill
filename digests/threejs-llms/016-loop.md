## Loop

This module offers a variety of ways to implement loops in TSL. In it's basic form it's:
```js
Loop( count, ( { i } ) => {

} );
```
However, it is also possible to define a start and end ranges, data types and loop conditions:
```js
Loop( { start: int( 0 ), end: int( 10 ), type: 'int', condition: '<', name: 'i' }, ( { i } ) => {

} );
```
Nested loops can be defined in a compacted form:
```js
Loop( 10, 5, ( { i, j } ) => {

} );
```
Loops that should run backwards can be defined like so:
```js
Loop( { start: 10 }, () => {} );
```
It is possible to execute with boolean values, similar to the `while` syntax.
```js
const value = float( 0 );

Loop( value.lessThan( 10 ), () => {

	value.addAssign( 1 );

} );
```
The module also provides `Break()` and `Continue()` TSL expression for loop control.
