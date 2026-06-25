## Math

| Name | Description |
| -- | -- |
| `EPSILON` | A small value used to handle floating-point precision errors. |
| `INFINITY` | Represent infinity. |
| `PI` | The mathematical constant π (pi). |
| `TWO_PI` | Two times π (2π). |
| `HALF_PI` | Half of π (π/2). |
| | |
| `abs( x )` | Return the absolute value of the parameter. |
| `acos( x )` | Return the arccosine of the parameter. |
| `all( x )` | Return true if all components of x are true. |
| `any( x )` | Return true if any component of x is true. |
| `asin( x )` | Return the arcsine of the parameter. |
| `atan( y, x )` | Return the arc-tangent of the parameters. |
| `bitcast( x, y )` | Reinterpret the bits of a value as a different type. |
| `cbrt( x )` | Return the cube root of the parameter. |
| `ceil( x )` | Find the nearest integer that is greater than or equal to the parameter. |
| `clamp( x, min, max )` | Constrain a value to lie between two further values. |
| `cos( x )` | Return the cosine of the parameter. |
| `cross( x, y )` | Calculate the cross product of two vectors. |
| `dFdx( p )` | Return the partial derivative of an argument with respect to x. |
| `dFdy( p )` | Return the partial derivative of an argument with respect to y. |
| `degrees( radians )` | Convert a quantity in radians to degrees. |
| `difference( x, y )` | Calculate the absolute difference between two values. |
| `distance( x, y )` | Calculate the distance between two points. |
| `dot( x, y )` | Calculate the dot product of two vectors. |
| `equals( x, y )` | Return true if x equals y. |
| `exp( x )` | Return the natural exponentiation of the parameter. |
| `exp2( x )` | Return 2 raised to the power of the parameter. |
| `faceforward( N, I, Nref )` | Return a vector pointing in the same direction as another. |
| `floor( x )` | Find the nearest integer less than or equal to the parameter. |
| `fract( x )` | Compute the fractional part of the argument. |
| `fwidth( x )` | Return the sum of the absolute derivatives in x and y. |
| `inverseSqrt( x )` | Return the inverse of the square root of the parameter. |
| `length( x )` | Calculate the length of a vector. |
| `lengthSq( x )` | Calculate the squared length of a vector. |
| `log( x )` | Return the natural logarithm of the parameter. |
| `log2( x )` | Return the base 2 logarithm of the parameter. |
| `max( x, y )` | Return the greater of two values. |
| `min( x, y )` | Return the lesser of two values. |
| `mix( x, y, a )` | Linearly interpolate between two values. |
| `negate( x )` | Negate the value of the parameter ( -x ). |
| `normalize( x )` | Calculate the unit vector in the same direction as the original vector. |
| `oneMinus( x )` | Return 1 minus the parameter. |
| `pow( x, y )` | Return the value of the first parameter raised to the power of the second. |
| `pow2( x )` | Return the square of the parameter. |
| `pow3( x )` | Return the cube of the parameter. |
| `pow4( x )` | Return the fourth power of the parameter. |
| `radians( degrees )` | Convert a quantity in degrees to radians. |
| `reciprocal( x )` | Return the reciprocal of the parameter (1/x). |
| `reflect( I, N )` | Calculate the reflection direction for an incident vector. |
| `refract( I, N, eta )` | Calculate the refraction direction for an incident vector. |
| `round( x )` | Round the parameter to the nearest integer. |
| `saturate( x )` | Constrain a value between 0 and 1. |
| `sign( x )` | Extract the sign of the parameter. |
| `sin( x )` | Return the sine of the parameter. |
| `smoothstep( e0, e1, x )` | Perform Hermite interpolation between two values. |
| `sqrt( x )` | Return the square root of the parameter. |
| `step( edge, x )` | Generate a step function by comparing two values. |
| `tan( x )` | Return the tangent of the parameter. |
| `transformDirection( dir, matrix )` | Transform the direction of a vector by a matrix and then normalize the result. |
| `trunc( x )` | Truncate the parameter, removing the fractional part. |

```js
const value = float( -1 );

// It's possible use `value.abs()` too.
const positiveValue = abs( value ); // output: 1
```
