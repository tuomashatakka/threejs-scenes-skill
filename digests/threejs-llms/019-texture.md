## Texture

| Name | Description | Type |
| -- | -- | -- |
| `texture( texture, uv = uv(), level = null )` | Retrieves texels from a texture. | `vec4` |
| `textureLoad( texture, uv, level = null )` | Fetches/loads texels without interpolation. | `vec4` |
| `textureStore( texture, uv, value )` | Stores a value into a storage texture. | `void` |
| `textureSize( texture, level = null )` | Returns the size of a texture. | `ivec2` |
| `textureBicubic( textureNode, strength = null )` | Applies mipped bicubic texture filtering. | `vec4` |
| `cubeTexture( texture, uvw = reflectVector, level = null )` | Retrieves texels from a cube texture. | `vec4` |
| `texture3D( texture, uvw = null, level = null )` | Retrieves texels from a 3D texture. | `vec4` |
| `triplanarTexture( textureX, textureY = null, textureZ = null, scale = float( 1 ), position = positionLocal, normal = normalLocal )` | Computes texture using triplanar mapping based on provided parameters. | `vec4` |
