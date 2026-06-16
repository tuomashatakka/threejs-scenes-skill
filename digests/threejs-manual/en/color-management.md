<!-- ingested from https://threejs.org/manual/en/color-management.html (direct markdown, no model) -->

Color Management 

 What is a color space? 

 Every color space is a collection of several design decisions, chosen together to support a
 large range of colors while satisfying technical constraints related to precision and display
 technologies. When creating a 3D asset, or assembling 3D assets together into a scene, it is
 important to know what these properties are, and how the properties of one color space relate
 to other color spaces in the scene.

 sRGB colors and white point (D65) displayed in the reference CIE 1931 chromaticity
 diagram. Colored region represents a 2D projection of the sRGB gamut, which is a 3D
 volume. Source: Wikipedia 

 Color primaries: Primary colors (e.g. red, green, blue) are not absolutes; they are
 selected from the visible spectrum based on constraints of limited precision and
 capabilities of available display devices. Colors are expressed as a ratio of the primary colors.

 White point: Most color spaces are engineered such that an equally weighted sum of
 primaries R = G = B will appear to be without color, or "achromatic". The appearance
 of achromatic values (like white or grey) depend on human perception, which in turn depends
 heavily on the context of the observer. A color space specifies its "white point" to balance
 these needs. The white point defined by the sRGB color space is
 [link:https://en.wikipedia.org/wiki/Illuminant_D65 D65].

 Transfer functions: After choosing the color gamut and a color model, we still need to
 define mappings ("transfer functions") of numerical values to/from the color space. Does r = 0.5 
 represent 50% less physical illumination than r = 1.0 ? Or 50% less bright, as perceived
 by an average human eye? These are different things, and that difference can be represented as
 a mathematical function. Transfer functions may be linear or nonlinear , depending
 on the objectives of the color space. sRGB defines nonlinear transfer functions. Those
 functions are sometimes approximated as gamma functions , but the term "gamma" is
 ambiguous and should be avoided in this context.

 These three parameters — color primaries, white point, and transfer functions — define a color
 space, with each chosen for particular goals. Having defined the parameters, a few additional terms
 are helpful:

 Color model: Syntax for numerically identifying colors within chosen the color gamut —
 a coordinate system for colors. In three.js we're mainly concerned with the RGB color
 model, having three coordinates r, g, b ∈ [0,1] ("closed domain") or
 r, g, b ∈ [0,∞] ("open domain") each representing a fraction of a primary
 color. Other color models (HSL, Lab, LCH) are commonly used for artistic control.

 Color gamut: Once color primaries and a white point have been chosen, these represent
 a volume within the visible spectrum (a "gamut"). Colors not within this volume ("out of gamut")
 cannot be expressed by closed domain [0,1] RGB values. In the open domain [0,∞], the gamut is
 technically infinite.

 Consider two very common color spaces: `SRGBColorSpace` ("sRGB") and
 `LinearSRGBColorSpace` ("Linear-sRGB"). Both use the same primaries and white point,
 and therefore have the same color gamut. Both use the RGB color model. They differ only in
 the transfer functions — Linear-sRGB is linear with respect to physical light intensity.
 sRGB uses the nonlinear sRGB transfer functions, and more closely resembles the way that
 the human eye perceives light and the responsiveness of common display devices.

 That difference is important. Lighting calculations and other rendering operations must
 generally occur in a linear color space. However, a linear colors are less efficient to
 store in an image or framebuffer, and do not look correct when viewed by a human observer.
 As a result, input textures and the final rendered image will generally use the nonlinear
 sRGB color space.

 ℹ️ NOTICE: While some modern displays support wider gamuts like Display-P3,
 the web platform's graphics APIs largely rely on sRGB. Applications using three.js
 today will typically use only the sRGB and Linear-sRGB color spaces. 

 Roles of color spaces 

 Linear workflows — required for modern rendering methods — generally involve more than
 one color space, each assigned to a particular role. Linear and nonlinear color spaces are
 appropriate for different roles, explained below.

 Input color space 

 Colors supplied to three.js — from color pickers, textures, 3D models, and other sources —
 each have an associated color space. Those not already in the Linear-sRGB working color
 space must be converted, and textures be given the correct texture.colorSpace assignment.
 Certain conversions (for hexadecimal and CSS colors in sRGB) can be made automatically if
 the THREE.ColorManagement API is enabled before initializing colors:

THREE.ColorManagement.enabled = true;

 THREE.ColorManagement is enabled by default.

 Materials, lights, and shaders: Colors in materials, lights, and shaders store
 RGB components in the Linear-sRGB working color space.

 Vertex colors: `BufferAttribute` store RGB components in the
 Linear-sRGB working color space.

 Color textures: PNG or JPEG `Texture` containing color information
 (like .map or .emissiveMap) use the closed domain sRGB color space, and must be annotated with
 texture.colorSpace = SRGBColorSpace . Formats like OpenEXR (sometimes used for .envMap or
 .lightMap) use the Linear-sRGB color space indicated with texture.colorSpace = LinearSRGBColorSpace ,
 and may contain values in the open domain [0,∞].

 Non-color textures: Textures that do not store color information (like .normalMap
 or .roughnessMap) do not have an associated color space, and generally use the (default) texture
 annotation of texture.colorSpace = NoColorSpace . In rare cases, non-color data
 may be represented with other nonlinear encodings for technical reasons.

 ⚠️ WARNING: Many formats for 3D models do not correctly or consistently
 define color space information. While three.js attempts to handle most cases, problems
 are common with older file formats. For best results, use glTF 2.0 (`GLTFLoader`)
 and test 3D models in online viewers early to confirm the asset itself is correct. 

 Working color space 

 Rendering, interpolation, and many other operations must be performed in an open domain
 linear working color space, in which RGB components are proportional to physical
 illumination. In three.js, the working color space is Linear-sRGB.

 Output color space 

 Output to a display device, image, or video may involve conversion from the open domain
 Linear-sRGB working color space to another color space. The conversion is defined by
 (`WebGLRenderer.outputColorSpace`). When using post-processing, this requires OutputPass.

 Display: Colors written to a WebGL canvas for display should be in the sRGB
 color space.

 Image: Colors written to an image should use the color space appropriate for
 the format and usage. Fully-rendered images written to PNG or JPEG textures generally
 use the sRGB color space. Images containing emission, light maps, or other data not
 confined to the [0,1] range will generally use the open domain Linear-sRGB color space,
 and a compatible image format like OpenEXR.

 ⚠️ WARNING: Render targets may use either sRGB or Linear-sRGB. sRGB makes
 better use of limited precision. In the closed domain, 8 bits often suffice for sRGB
 whereas ≥12 bits (half float) may be required for Linear-sRGB. If later pipeline
 stages require Linear-sRGB input, the additional conversions may have a small
 performance cost. 

 Custom materials based on `ShaderMaterial` and `RawShaderMaterial` have to implement their own output color space conversion.
 For instances of `ShaderMaterial`, adding the `colorspace_fragment` shader chunk to the fragment shader's `main()` function should be sufficient.

 Working with THREE.Color instances 

 Methods reading or modifying `Color` instances assume data is already in the
 three.js working color space, Linear-sRGB. RGB and HSL components are direct
 representations of data stored by the Color instance, and are never converted
 implicitly. Color data may be explicitly converted with .convertLinearToSRGB() 
 or .convertSRGBToLinear() .



```js
// RGB components (no change).
color.r = color.g = color.b = 0.5;
console.log( color.r ); // → 0.5

// Manual conversion.
color.r = 0.5;
color.convertSRGBToLinear();
console.log( color.r ); // → 0.214041140
```



 With ColorManagement.enabled = true set (recommended), certain conversions
 are made automatically. Because hexadecimal and CSS colors are generally sRGB, `Color`
 methods will automatically convert these inputs from sRGB to Linear-sRGB in setters, or
 convert from Linear-sRGB to sRGB when returning hexadecimal or CSS output from getters.



```js
// Hexadecimal conversion.
color.setHex( 0x808080 );
console.log( color.r ); // → 0.214041140
console.log( color.getHex() ); // → 0x808080

// CSS conversion.
color.setStyle( 'rgb( 0.5, 0.5, 0.5 )' );
console.log( color.r ); // → 0.214041140

// Override conversion with 'colorSpace' argument.
color.setHex( 0x808080, LinearSRGBColorSpace );
console.log( color.r ); // → 0.5
console.log( color.getHex( LinearSRGBColorSpace ) ); // → 0x808080
console.log( color.getHex( SRGBColorSpace ) ); // → 0xBCBCBC
```



 Common mistakes 

 When an individual color or texture is misconfigured, it will appear darker or lighter than
 expected. When the renderer's output color space is misconfigured, the entire scene may appear
 darker (e.g. missing conversion to sRGB) or lighter (e.g. a double conversion to sRGB with
 post-processing). In each case the problem may not be uniform, and simply increasing/decreasing
 lighting does not solve it.

 A more subtle issue appears when both the input color spaces and the output color
 spaces are incorrect — the overall brightness levels may be fine, but colors may change
 unexpectedly under different lighting, or shading may appear more blown-out and less soft
 than intended. These two wrongs do not make a right, and it's important that the working
 color space be linear ("scene referred") and the output color space be nonlinear
 ("display referred").

 Further reading 

 GPU Gems 3: The Importance of Being Linear , by Larry Gritz and Eugene d'Eon

 What every coder should know about gamma , by John Novak

 The Hitchhiker's Guide to Digital Color , by Troy Sobotka

 Color Management , Blender
