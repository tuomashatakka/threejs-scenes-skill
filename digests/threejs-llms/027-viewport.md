## Viewport

`viewport` is influenced by the area defined in `renderer.setViewport()`, different of the values ​​defined in the renderer that are `logical pixel units`, it use `physical pixel units` considering the current `Pixel Ratio`.

| Variable | Description | Type |
| -- | -- | -- |
| `viewportUV` | Returns the normalized viewport coordinate. | `vec2` |
| `viewport` | Returns the viewport dimension in physical pixel units. | `vec4` |
| `viewportCoordinate` | Returns the viewport coordinate in physical pixel units. | `vec2` |
| `viewportSize` | Returns the viewport size in physical pixel units. | `vec2` |
| `viewportSharedTexture( uvNode = screenUV, levelNode = null )` | Accesses what has already been rendered, preserving render-order. | `vec4` |
| `viewportDepthTexture( uvNode = screenUV, levelNode = null )` | Returns the depth texture of the viewport. | `float` |
| `viewportLinearDepth` | Returns the linear (orthographic) depth value of the current fragment. | `float` |
| `viewportMipTexture( uvNode = screenUV, levelNode = null, framebufferTexture = null )` | Returns a viewport texture with mipmap generation enabled. | `vec4` |
| `viewportSafeUV( uv = screenUV )` | Returns safe UV coordinates for refraction purposes. | `vec2` |
