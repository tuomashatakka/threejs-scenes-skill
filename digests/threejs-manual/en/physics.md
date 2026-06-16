<!-- ingested from https://threejs.org/manual/en/physics.html (direct markdown, no model) -->

Physics 

 Physics engines allow you to simulate physical phenomena like gravity, collisions, and forces within
 your 3D capabilities. In a typical three.js scene, objects are moved by directly modifying their
 position or rotation. When using a physics engine, however, you create a parallel physics world
 where bodies react to forces and collisions. You then synchronize the three.js meshes with these
 physics bodies on every frame, creating the illusion of a physically simulated environment.

 It should be noted that the physics engine does not necessarily have to be updated every frame.
 Usually, to keep experiences consistent, physics are updated at fixed time steps. For instance, it could
 be that we are running the game loop at 60fps but the physics engine at 30fps (that is 1/30=3.33ms)
 while updating the three.js meshes' transforms (e.g., positions and rotations) with the most recent
 state from the physics engine.

 Physics simulations are particularly useful for games, interactive visualizations, and any
 application requiring realistic object behavior, such as objects falling, bouncing, or sliding.

 Integration Approaches 

 There are three main ways to integrate a physics engine into a three.js project:

 1. Using Three.js Physics Addons 

 Three.js provides wrapper classes for several popular physics engines in the
 examples/jsm/physics directory. These addons simplify the setup process by handling the
 initialization of the physics world and the synchronization of meshes.

 Available addons include:

 AmmoPhysics: A wrapper for Ammo.js (Bullet Physics). 
 JoltPhysics: A wrapper for Jolt Physics. 
 RapierPhysics: A wrapper for Rapier. 

 These addons effectively hide much of the complexity of the underlying engines. For standard use
 cases, they offer a very quick way to get started.

 Examples

 physics / ammo / instancing 
 physics / jolt / instancing 
 physics / rapier / instancing 

 2. Using 3rd-Party Physics JS/TS Libraries 

 Many physics engines are written directly in JavaScript or TypeScript and are designed to work
 easily with the web ecosystem. Libraries like cannon-es are popular choices because they are
 lightweight and easy to integrate specifically with three.js.

 When using these libraries, you instantiate the physics world and bodies yourself, then manually
 copy the position and quaternion from the physics body to the three.js mesh in your animation loop.

 Projects

 cannon-es : A lightweight 3D physics engine purely written in JS/TS. Under an MIT license. Apparently no longer maintained (latest commit more than a couple years ago). 
 cannon.js : A lightweight 3D physics engine purely written in JavaScript. Under an MIT license. No longer maintained (latest commit more than a couple years ago). Consider using its more recent fork cannon-es. 
 phy : Physics engine for three.js purely written in JavaScript. Under an MIT license. Latest commit. Currently maintained. 
 Oimo.js : A no-longer maintained lightweight 3D physics engine written purely in JavaScript. Under an MIT license. Consider using phy instead (as per the author's advise). 

 It should also be noted that there are a couple of 3D physics engines that are seemingly written in JS/TS but are in reality calling other standalone 3D physics engines. For example:

 Physijs : Calls ammo.js under the hood to do physics work in a separate thread (using web workers). Under MIT license. Apparently no longer maintained (latest commit more than a couple of years ago). 
 enable3d : 3D physics framework for three.js built on top of ammo.js. Under LGPL-3.0 license. Apparently maintained. 

 3. Importing WASM-based Engines 

 For maximum performance, stability, and precision, especially with complex simulations, you can use physics engines written in
 C++ or Rust (or any other language that supports WASM) that have been compiled to WebAssembly (WASM). Engines like Ammo.js (a port of
 Bullet Physics) and Rapier fall into this category.

 While this approach offers the most features and best performance, it often requires more setup code
 to handle the WASM memory management and interaction with the physics API directly.

 Examples

 physics / ammo / break 
 physics / ammo / cloth 
 physics / ammo / rope 
 physics / ammo / terrain 
 physics / ammo / volume 

 Projects

 JoltPhysics : A multi core friendly rigid body physics and collision detection library. Written in C++. Under MIT license. Actively maintained. Proven with its usage in world-renowned titles and game engines including: Horizon Forbidden West, Death Stranding 2, and official supported by the Godot game engine. 
 PhysX : Industry-standard realtime 3D physics engine provided by NVIDIA. Under BSD-3-Clause license. Actively maintained and very stable. 
 Rapier : 2D and 3D physics engines focused on performance. Written in Rust. Under an MIT license. Actively maintained. 
 Bullet : 
 Real-time collision detection and multi-physics simulation for VR, games, visual effects, robotics, machine learning etc. Written in C++. Under a ZLIB license. Potentially no longer maintained. 

 Some of these multi-platform 3D physics engines have a ready-to-use WASM port, including:

 JoltPhysics.js : Port of JoltPhysics to JavaScript using Emscripten. Under MIT license. Currently maintained. 
 physx-js-webidl : Javascript WASM bindings for Nvidia PhysX. Under MIT license. Currently maintained. 
 Rapier.js : Official JavaScript bindings for the Rapier physics engine. Under Apache-2.0 license. Actively maintained. 
 Ammo.js : Direct port of the Bullet physics engine to JavaScript using Emscripten. No longer maintained (latest commit a couple of years ago). Under an MIT-like custom permissive license.
