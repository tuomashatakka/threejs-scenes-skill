<!-- ingested from https://threejs.org/manual/en/matrix-transformations.html (direct markdown, no model) -->

Matrix Transformations 

 Three.js uses `matrices` to encode 3D transformations---translations (position), rotations, and scaling. Every instance of `Object3D` has a `matrix` which stores that object's position, rotation, and scale. This page describes how to update an object's transformation.

 Convenience properties and `matrixAutoUpdate` 

 There are two ways to update an object's transformation:

 Modify the object's `position`, `quaternion`, and `scale` properties, and let three.js recompute
 the object's matrix from these properties:


```js
object.position.copy( start_position );
object.quaternion.copy( quaternion );
```


 By default, the `matrixAutoUpdate` property is set true, and the matrix will be automatically recalculated.
 If the object is static, or you wish to manually control when recalculation occurs, better performance can be obtained by setting the property false:


```js
object.matrixAutoUpdate = false;
```


 And after changing any properties, manually update the matrix:


```js
object.updateMatrix();
```



 Modify the object's matrix directly. The `Matrix4` class has various methods for modifying the matrix:


```js
object.matrix.makeRotationFromQuaternion( quaternion );
object.matrix.setPosition( start_position );
object.matrixAutoUpdate = false;
```


 Note that `matrixAutoUpdate` must be set to `false` in this case, and you should make sure not to call `updateMatrix`. Calling `updateMatrix` will clobber the manual changes made to the matrix, recalculating the matrix from `position`, `scale`, and so on.

 Object and world matrices 
 
 An object's matrix stores the object's transformation relative to the object's parent; to get the object's transformation in world coordinates, you must access the object's world matrix.

 When either the parent or the child object's transformation changes, you can request that the child object's world matrix be updated by calling `object.updateMatrixWorld()`.

 An object can be transformed via `applyMatrix4()`. Note: Under-the-hood, this method relies on `Matrix4.decompose()`, and not all matrices are decomposable in this way. For example, if an object has a non-uniformly scaled parent, then the object's world matrix may not be decomposable, and this method may not be appropriate.

 Rotation and Quaternion 
 
 Three.js provides two ways of representing 3D rotations: Euler angles and Quaternions, as well as methods for converting between the two. Euler angles are subject to a problem called "gimbal lock," where certain configurations can lose a degree of freedom (preventing the object from being rotated about one axis). For this reason, object rotations are always stored in the object's quaternion.

 Previous versions of the library included a `useQuaternion` property which, when set to false, would cause the object's matrix to be calculated from an Euler angle. This practice is deprecated---instead, you should use the `object.setRotationFromEuler()` method, which will update the quaternion.
