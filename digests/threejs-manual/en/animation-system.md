<!-- ingested from https://threejs.org/manual/en/animation-system.html (direct markdown, no model) -->

Animation System 

 Overview 

 Within the three.js animation system you can animate various properties of your models:
 the bones of a skinned and rigged model, morph targets, different material properties
 (colors, opacity, booleans), visibility and transforms. The animated properties can be faded in,
 faded out, crossfaded and warped. The weight and time scales of different simultaneous
 animations on the same object as well as on different objects can be changed
 independently. Various animations on the same and on different objects can be
 synchronized. 

 To achieve all this in one homogeneous system, the three.js animation system
 [link:https://github.com/mrdoob/three.js/issues/6881 has completely changed in 2015]
 (beware of outdated information!), and it has now an architecture similar to
 Unity/Unreal Engine 4. This page gives a short overview of the main components of the
 system and how they work together.

 Animation Clips 

 If you have successfully imported an animated 3D object (it doesn't matter if it has
 bones or morph targets or both) — for example exporting it from Blender with the
 [link:https://github.com/KhronosGroup/glTF-Blender-IO glTF Blender exporter] and
 loading it into a three.js scene using `GLTFLoader` — one of the response fields
 should be an array named "animations", containing the animation clips
 for this model (see a list of possible loaders below). 

 Each `AnimationClip` usually holds the data for a certain activity of the object. If the
 mesh is a character, for example, there may be one AnimationClip for a walkcycle, a second
 for a jump, a third for sidestepping and so on.

 Keyframe Tracks 

 Inside of such an `AnimationClip` the data for each animated property are stored in a
 separate `KeyframeTrack`. Assuming a character object has a skeleton,
 one keyframe track could store the data for the position changes of the lower arm bone
 over time, a different track the data for the rotation changes of the same bone, a third
 the track position, rotation or scaling of another bone, and so on. It should be clear,
 that an AnimationClip can be composed of lots of such tracks. 

 Assuming the model has morph targets (for example one morph
 target showing a friendly face and another showing an angry face), each track holds the
 information as to how the influence of a certain morph target changes during the performance 
 of the clip.

 Animation Mixer 

 The stored data forms only the basis for the animations - actual playback is controlled by
 the `AnimationMixer`. You can imagine this not only as a player for animations, but
 as a simulation of a hardware like a real mixer console, which can control several animations
 simultaneously, blending and merging them.

 Animation Actions 

 The `AnimationMixer` itself has only very few (general) properties and methods, because it
 can be controlled by the animation actions. By configuring an
 `AnimationAction` you can determine when a certain `AnimationClip` shall be played, paused
 or stopped on one of the mixers, if and how often the clip has to be repeated, whether it
 shall be performed with a fade or a time scaling, and some additional things, such crossfading
 or synchronizing.

 Animation Object Groups 

 If you want a group of objects to receive a shared animation state, you can use an
 `AnimationObjectGroup`.

 Supported Formats and Loaders 

 Note that not all model formats include animation (OBJ notably does not), and that only some
 three.js loaders support `AnimationClip` sequences. Several that do 
 support this animation type:

 THREE.ObjectLoader 
 THREE.BVHLoader 
 THREE.ColladaLoader 
 THREE.FBXLoader 
 THREE.GLTFLoader 

 Note that 3ds max and Maya currently can't export multiple animations (meaning animations which are not
 on the same timeline) directly to a single file.

 Example 

 BLOCK0
