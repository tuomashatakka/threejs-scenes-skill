<!-- ingested from https://raw.githubusercontent.com/mrdoob/three.js/dev/docs/pages/AnimationObjectGroup.html.md (direct markdown, no model) -->

# AnimationObjectGroup

A group of objects that receives a shared animation state.

Usage:

*   Add objects you would otherwise pass as 'root' to the constructor or the .clipAction method of AnimationMixer.
*   Instead pass this object as 'root'.
*   You can also add and remove objects later when the mixer is running.

Note:

*   Objects of this class appear as one object to the mixer, so cache control of the individual objects must be done on the group.

Limitation:

*   The animated properties must be compatible among the all objects in the group.
*   A single property can either be controlled through a target group or directly, but not both.

## Constructor

### new AnimationObjectGroup( …arguments : Object3D )

Constructs a new animation group.

**arguments**

An arbitrary number of 3D objects that share the same animation state.

## Properties

### .isAnimationObjectGroup : boolean (readonly)

This flag can be used for type testing.

Default is `true`.

### .uuid : string (readonly)

The UUID of the 3D object.

## Methods

### .add( …arguments : Object3D )

Adds an arbitrary number of objects to this animation group.

**arguments**

The 3D objects to add.

### .remove( …arguments : Object3D )

Removes an arbitrary number of objects to this animation group

**arguments**

The 3D objects to remove.

### .uncache( …arguments : Object3D )

Deallocates all memory resources for the passed 3D objects of this animation group.

**arguments**

The 3D objects to uncache.

## Source

[src/animation/AnimationObjectGroup.js](https://github.com/mrdoob/three.js/blob/master/src/animation/AnimationObjectGroup.js)
