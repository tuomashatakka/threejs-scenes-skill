## Screen

Screen nodes will return the values related to the current `frame buffer`, either normalized or in `physical pixel units` considering the current `Pixel Ratio`.

| Variable | Description | Type |
| -- | -- | -- |
| `screenUV` | Returns the normalized frame buffer coordinate. | `vec2` |
| `screenCoordinate` | Returns the frame buffer coordinate in physical pixel units. | `vec2` |
| `screenSize` | Returns the frame buffer size in physical pixel units. | `vec2` |
| `screenDPR` | Returns the device pixel ratio (DPR). | `float` |
