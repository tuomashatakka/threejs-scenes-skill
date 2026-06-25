## Attributes

| Name | Description | Type |
| -- | -- | -- |
| `attribute( name, type = null )` | Getting geometry attribute using name and type. | `any` |
| `uv( index = 0 )` | UV attribute named `uv + index`. | `vec2` |
| `vertexColor( index = 0 )` | Vertex color node for the specified index. | `color` |
| `instanceIndex` | The index of the current instance. | `uint` |
| `vertexIndex` | The index of a vertex within a mesh. | `uint` |
| `drawIndex` | The draw index when using multi-draw. | `uint` |
| `batch( batchMesh )` | Creates a batch node for BatchedMesh. | `BatchNode` |
| `instance( instancedMesh )` | Creates an instance node for InstancedMesh. | `InstanceNode` |
