<!-- ingested from https://threejs.org/manual/en/uniform-types.html (direct markdown, no model) -->

Uniform Types 

 Each uniform must have a `value` property. The type of the value must
 correspond to the type of the uniform variable in the GLSL code as
 specified for the primitive GLSL types in the table below. Uniform
 structures and arrays are also supported. GLSL arrays of primitive type
 must either be specified as an array of the corresponding THREE objects or
 as a flat array containing the data of all the objects. In other words;
 GLSL primitives in arrays must not be represented by arrays. This rule
 does not apply transitively. An array of `vec2` arrays, each with a length
 of five vectors, must be an array of arrays, of either five `Vector2`
 objects or ten `number`s.

 GLSL type 
 JavaScript type 

 int 
 Number 

 uint 
 Number 

 float 
 Number 

 bool 
 Boolean 

 bool 
 Number 

 vec2 
 Vector2 

 vec2 
 Float32Array (*) 

 vec2 
 Array (*) 

 vec3 
 Vector3 

 vec3 
 Color 

 vec3 
 Float32Array (*) 

 vec3 
 Array (*) 

 vec4 
 Vector4 

 vec4 
 Quaternion 

 vec4 
 Float32Array (*) 

 vec4 
 Array (*) 

 mat2 
 Float32Array (*) 

 mat2 
 Array (*) 

 mat3 
 Matrix3 

 mat3 
 Float32Array (*) 

 mat3 
 Array (*) 

 mat4 
 Matrix4 

 mat4 
 Float32Array (*) 

 mat4 
 Array (*) 

 ivec2, bvec2 
 Float32Array (*) 

 ivec2, bvec2 
 Array (*) 

 ivec3, bvec3 
 Int32Array (*) 

 ivec3, bvec3 
 Array (*) 

 ivec4, bvec4 
 Int32Array (*) 

 ivec4, bvec4 
 Array (*) 

 sampler2D 
 Texture 

 samplerCube 
 CubeTexture 

 (*) Same for an (innermost) array (dimension) of the same GLSL type,
 containing the components of all vectors or matrices in the array.

 Structured Uniforms 

 Sometimes you want to organize uniforms as `structs` in your shader code.
 The following style must be used so `three.js` is able to process
 structured uniform data.
 


```js
uniforms = {
  data: { 
    value: {
      position: new Vector3(), 
      direction: new Vector3( 0, 0, 1 ) 
    } 
  } 
};
```


 This definition can be mapped on the following GLSL code:


```js
struct Data { 
  vec3 position;
  vec3 direction;
};
uniform Data data;
```


 
 Structured Uniforms with Arrays 

 It's also possible to manage `structs` in arrays. The syntax for this use
 case looks like so:
 


```js
const entry1 = {
  position: new Vector3(),
  direction: new Vector3( 0, 0, 1 )
};
const entry2 = {
  position: new Vector3( 1, 1, 1 ),
  direction: new Vector3( 0, 1, 0 )
};

uniforms = {
  data: {
    value: [ entry1, entry2 ]
  }
};
```


 This definition can be mapped on the following GLSL code:
 BLOCK3
