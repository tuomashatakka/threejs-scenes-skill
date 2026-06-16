<!-- ingested from https://threejs.org/manual/en/creating-text.html (direct markdown, no model) -->

Creating Text 

 There are often times when you might need to use text in your three.js application - here are
 a couple of ways that you can do so.

 1. DOM + CSS 

 Using HTML is generally the easiest and fastest manner to add text. This is the method
 used for descriptive overlays in most three.js examples.
 
 You can add content to a 


```js
<div id="info">Description</div>
```


 
 and use CSS markup to position absolutely at a position above all others with a
 z-index especially if you are running three.js full screen.



```js
#info {
  position: absolute;
  top: 10px;
  width: 100%;
  text-align: center;
  z-index: 100;
  display:block;
}
```



 2. Use `CSS2DRenderer` or `CSS3DRenderer` 

 Use these renderers to draw high-quality text contained in DOM elements to your three.js scene.
 This is similar to 1. except that with these renderers elements can be integrated more tightly and dynamically into the scene.

 3. Draw text to canvas and use as a `Texture` 
 
 Use this method if you wish to draw text easily on a plane in your three.js scene. 

 4. Create a model in your favourite 3D application and export to three.js 
 
 Use this method if you prefer working with your 3d applications and importing the models to three.js. 

 5. Procedural Text Geometry 

 If you prefer to work purely in THREE.js or to create procedural and dynamic 3D
 text geometries, you can create a mesh whose geometry is an instance of THREE.TextGeometry:

 new THREE.TextGeometry( text, parameters ); 

 In order for this to work, however, your TextGeometry will need an instance of THREE.Font
 to be set on its "font" parameter.
 
 See the `TextGeometry` page for more info on how this can be done, descriptions of each
 accepted parameter, and a list of the JSON fonts that come with the THREE.js distribution itself.

 Examples 

 [example:webgl_geometry_text WebGL / geometry / text] 
 [example:webgl_shadowmap WebGL / shadowmap]

 If Typeface is down, or you want to use a font that is not there, there's a tutorial
 with a python script for blender that allows you to export text to Three.js's JSON format:
 [link:http://www.jaanga.com/2012/03/blender-to-threejs-create-3d-text-with.html]

 6. Bitmap Fonts 

 BMFonts (bitmap fonts) allow batching glyphs into a single BufferGeometry. BMFont rendering
 supports word-wrapping, letter spacing, kerning, signed distance fields with standard
 derivatives, multi-channel signed distance fields, multi-texture fonts, and more.
 See [link:https://github.com/felixmariotto/three-mesh-ui three-mesh-ui] or [link:https://github.com/Jam3/three-bmfont-text three-bmfont-text].

 Stock fonts are available in projects like
 [link:https://github.com/etiennepinchon/aframe-fonts A-Frame Fonts], or you can create your own
 from any .TTF font, optimizing to include only characters required for a project.

 Some helpful tools:

 [link:http://msdf-bmfont.donmccurdy.com/ msdf-bmfont-web] (web-based) 
 [link:https://github.com/soimy/msdf-bmfont-xml msdf-bmfont-xml] (commandline) 
 [link:https://github.com/libgdx/libgdx/wiki/Hiero hiero] (desktop app) 

 7. Troika Text 

 The [link:https://www.npmjs.com/package/troika-three-text troika-three-text] package renders 
 quality antialiased text using a similar technique as BMFonts, but works directly with any .TTF 
 or .WOFF font file so you don't have to pregenerate a glyph texture offline. It also adds 
 capabilities including:

 Effects like strokes, drop shadows, and curvature 
 The ability to apply any three.js Material, even a custom ShaderMaterial 
 Support for font ligatures, scripts with joined letters, and right-to-left/bidirectional layout 
 Optimization for large amounts of dynamic text, performing most work off the main thread in a web worker
