## Array

The array() function in TSL allows creating constant or dynamic value arrays; there are many ways to create arrays in TSL.

#### The standard way

```js
const colors = array( [
	vec3( 1, 0, 0 ),
	vec3( 0, 1, 0 ),
	vec3( 0, 0, 1 )
] );

const greenColor = colors.element( 1 );

// greenColor: vec3( 0, 1, 0 )
```

#### Fixed size

```js
const a = array( 'vec3', 2 );

// a: [ vec3( 0, 0, 0 ), vec3( 0, 0, 0 ) ]
```

#### Fill with a default value

```js
const a = vec3( 0, 0, 1 ).toArray( 2 ); 

// a: [ vec3( 0, 0, 1 ), vec3( 0, 0, 1 ) ]
```

#### Define a type explicitly

```js
const a = array( [ 0, 1, 2 ], 'uint' );
const value = a.element( 1 );

// value: 1u
```

### Array Uniform

It is possible to use the same array logic for uniforms using Three.js native components or primitive values.

```js
const tintColors = uniformArray( [
	new Color( 1, 0, 0 ),
	new Color( 0, 1, 0 ),
	new Color( 0, 0, 1 )
], 'color' );

const redColor = tintColors.element( 0 );
```

#### Accessing values

To access the values you can use `a[ 1 ]` or `a.element( 1 )`. The difference is that `a[ 1 ]` only allows constant values, while `a.element( 1 )` allows the use of dynamic values such as `a.element( index )` where index is a node.

### Array Storage

It is possible to create arrays that can be used in compute shaders and storage operations.

| Name | Description |
| -- | -- |
| `instancedArray( array, type )` | Creates an instanced buffer attribute array. |
| `attributeArray( array, type )` | Creates a buffer attribute array. |
