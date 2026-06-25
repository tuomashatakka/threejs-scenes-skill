## Operators

| Name | Description |
| -- | -- |
| `.add( node \| value, ... )` | Return the addition of two or more value. |
| `.sub( node \| value )` | Return the subraction of two or more value. |
| `.mul( node \| value )` | Return the multiplication of two or more value. |
| `.div( node \| value )` | Return the division of two or more value. |
| `.mod( node \| value )` | Computes the remainder of dividing the first node by the second. |
| `.equal( node \| value )` | Checks if two nodes are equal. |
| `.notEqual( node \| value )` | Checks if two nodes are not equal. |
| `.lessThan( node \| value )` | Checks if the first node is less than the second. |
| `.greaterThan( node \| value )` | Checks if the first node is greater than the second. |
| `.lessThanEqual( node \| value )` | Checks if the first node is less than or equal to the second. |
| `.greaterThanEqual( node \| value )` | Checks if the first node is greater than or equal to the second. |
| `.and( node \| value )` | Performs logical AND on two nodes. |
| `.or( node \| value )` | Performs logical OR on two nodes. |
| `.not( node \| value )` | Performs logical NOT on a node. |
| `.xor( node \| value )` | Performs logical XOR on two nodes. |
| `.bitAnd( node \| value )` | Performs bitwise AND on two nodes. |
| `.bitNot( node \| value )` | Performs bitwise NOT on a node. |
| `.bitOr( node \| value )` | Performs bitwise OR on two nodes. |
| `.bitXor( node \| value )` | Performs bitwise XOR on two nodes. |
| `.shiftLeft( node \| value )` | Shifts a node to the left. |
| `.shiftRight( node \| value )` | Shifts a node to the right. |
| | |
| `.assign( node \| value )` | Assign one or more value to a and return the same. |
| `.addAssign( node \| value )` | Adds a value and assigns the result. |
| `.subAssign( node \| value )` | Subtracts a value and assigns the result. |
| `.mulAssign( node \| value )` | Multiplies a value and assigns the result. |
| `.divAssign( node \| value )` | Divides a value and assigns the result. |

```js
const a = float( 1 );
const b = float( 2 );

const result = a.add( b ); // output: 3
```
