<!-- ingested from https://threejs.org/manual/en/materials.html (direct markdown, no model) -->

Materials 

 This article is part of a series of articles about three.js. The
first article is three.js fundamentals . If
you haven't read that yet and you're new to three.js you might want to
consider starting there. 
 Three.js provides several types of materials.
They define how objects will appear in the scene.
Which materials you use really depends on what you're trying to
accomplish. 
 There are 2 ways to set most material properties. One at creation time which
we've seen before. 


```js
const material = new THREE.MeshPhongMaterial({
  color: 0xFF0000,    // red (can also use a CSS color string here)
  flatShading: true,
});
```


 The other is after creation 


```js
const material = new THREE.MeshPhongMaterial();
material.color.setHSL(0, 1, .5);  // red
material.flatShading = true;
```


 note that properties of type THREE.Color have multiple ways to be set. 


```js
material.color.set(0x00FFFF);    // same as CSS's #RRGGBB style
material.color.set(cssString);   // any CSS color, eg 'purple', '#F32',
                                 // 'rgb(255, 127, 64)',
                                 // 'hsl(180, 50%, 25%)'
material.color.set(someColor)    // some other THREE.Color
material.color.setHSL(h, s, l)   // where h, s, and l are 0 to 1
material.color.setRGB(r, g, b)   // where r, g, and b are 0 to 1
```


 And at creation time you can pass either a hex number or a CSS string 


```js
const m1 = new THREE.MeshBasicMaterial({color: 0xFF0000});         // red
const m2 = new THREE.MeshBasicMaterial({color: 'red'});            // red
const m3 = new THREE.MeshBasicMaterial({color: '#F00'});           // red
const m4 = new THREE.MeshBasicMaterial({color: 'rgb(255,0,0)'});   // red
const m5 = new THREE.MeshBasicMaterial({color: 'hsl(0,100%,50%)'}); // red
```


 So let's go over three.js's set of materials. 
 The MeshBasicMaterial is not affected by lights.
The MeshLambertMaterial computes lighting only at the vertices vs the MeshPhongMaterial which computes lighting at every pixel. The MeshPhongMaterial 
also supports specular highlights. 

 Basic 

 Lambert 

 Phong 

 low-poly models with same materials 

 The shininess setting of the MeshPhongMaterial determines the shininess of the specular highlight. It defaults to 30. 

 shininess: 0 

 shininess: 30 

 shininess: 150 

 Note that setting the emissive property to a color on either a
 MeshLambertMaterial or a MeshPhongMaterial and setting the color to black
(and shininess to 0 for phong) ends up looking just like the MeshBasicMaterial . 

 Basic 
 color: 'purple' 

 Lambert 
 color: 'black' 
 emissive: 'purple' 

 Phong 
 color: 'black' 
 emissive: 'purple' 
 shininess: 0 

 Why have all 3 when MeshPhongMaterial can do the same things as MeshBasicMaterial 
and MeshLambertMaterial ? The reason is the more sophisticated material
takes more GPU power to draw. On a slower GPU like say a mobile phone
you might want to reduce the GPU power needed to draw your scene by
using one of the less complex materials. It also follows that if you
don't need the extra features then use the simplest material. If you don't
need the lighting and the specular highlight then use the MeshBasicMaterial . 
 The MeshToonMaterial is similar to the MeshPhongMaterial 
with one big difference. Rather than shading smoothly it uses a gradient map
(an X by 1 texture) to decide how to shade. The default uses a gradient map
that is 70% brightness for the first 70% and 100% after but you can supply your
own gradient map. This ends up giving a 2 tone look that looks like a cartoon. 

 Next up there are 2 physically based rendering materials. Physically Based
Rendering is often abbreviated PBR. 
 The materials above use simple math to make materials that look 3D but they
aren't what actually happens in real world. The 2 PBR materials use much more
complex math to come close to what actually happens in the real world. 
 The first one is MeshStandardMaterial . The biggest difference between
 MeshPhongMaterial and MeshStandardMaterial is it uses different parameters.
 MeshPhongMaterial had a shininess setting. MeshStandardMaterial has 2
settings roughness and metalness . 
 At a basic level roughness is the opposite
of shininess . Something that has a high roughness, like a baseball doesn't
have hard reflections whereas something that's not rough, like a billiard ball,
is very shiny. Roughness goes from 0 to 1. 
 The other setting, metalness , says
how metal the material is. Metals behave differently than non-metals. 0
for non-metal and 1 for metal. 
 Here's a quick sample of MeshStandardMaterial with roughness from 0 to 1
across and metalness from 0 to 1 down. 

 The MeshPhysicalMaterial is same as the MeshStandardMaterial but it
adds a clearcoat parameter that goes from 0 to 1 for how much to
apply a clearcoat gloss layer and a clearCoatRoughness parameter
that specifies how rough the gloss layer is. 
 Here's the same grid of roughness by metalness as above but with
 clearcoat and clearCoatRoughness settings. 

 The various standard materials progress from fastest to slowest
 MeshBasicMaterial ➡ MeshLambertMaterial ➡ MeshPhongMaterial ➡
 MeshStandardMaterial ➡ MeshPhysicalMaterial . The slower materials
can make more realistic looking scenes but you might need to design
your code to use the faster materials on low powered or mobile machines. 
 There are 3 materials that have special uses. ShadowMaterial 
is used to get the data created from shadows. We haven't
covered shadows yet. When we do we'll use this material
to take a peek at what's happening behind the scenes. 
 The MeshDepthMaterial renders the depth of each pixel where
pixels at negative near of the camera are 0 and negative far are 1. Certain special effects can use this data which we'll
get into at another time. 

 The MeshNormalMaterial will show you the normals of geometry.
 Normals are the direction a particular triangle or pixel faces.
 MeshNormalMaterial draws the view space normals (the normals relative to the camera).
 x is red ,
 y is green , and
 z is blue so things facing
to the right will be pink ,
to the left will be aqua ,
up will be light green ,
down will be purple ,
and toward the screen will be lavender . 

 ShaderMaterial is for making custom materials using the three.js shader
system. RawShaderMaterial is for making entirely custom shaders with
no help from three.js. Both of these topics are large and will be
covered later. 
 Most materials share a bunch of settings all defined by Material .
 See the docs 
for all of them but let's go over two of the most commonly used
properties. 
 flatShading :
whether or not the object looks faceted or smooth. default = false . 

 flatShading: false 

 flatShading: true 

 side : which sides of triangles to show. The default is THREE.FrontSide .
Other options are THREE.BackSide and THREE.DoubleSide (both sides).
Most 3D objects drawn in three are probably opaque solids so the back sides
(the sides facing inside the solid) do not need to be drawn. The most common
reason to set side is for planes or other non-solid objects where it is
common to see the back sides of triangles. 
 Here are 6 planes drawn with THREE.FrontSide and THREE.DoubleSide . 

 side: THREE.FrontSide 

 side: THREE.DoubleSide 

 There's really a lot to consider with materials and we actually still
have a bunch more to go. In particular we've mostly ignored textures
which open up a whole slew of options. Before we cover textures though
we need to take a break and cover
 setting up your development environment 
 
 material.needsUpdate 
 
This topic rarely affects most three.js apps but just as an FYI...
Three.js applies material settings when a material is used where "used"
means "something is rendered that uses the material". Some material settings are
only applied once as changing them requires lots of work by three.js.
In those cases you need to set material.needsUpdate = true to tell
three.js to apply your material changes. The most common settings
that require you to set needsUpdate if you change the settings after
using the material are:

 flatShading 
 adding or removing a texture
 
 Changing a texture is ok, but if want to switch from using no texture
 to using a texture or from using a texture to using no texture
 then you need to set needsUpdate = true .
 
 In the case of going from texture to no-texture it is often
 just better to use a 1x1 pixel white texture. 

 As mentioned above most apps never run into these issues. Most apps
do not switch between flat shaded and non flat shaded. Most apps also
either use textures or a solid color for a given material, they rarely
switch from using one to using the other.
