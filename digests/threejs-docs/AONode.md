<!-- ingested from https://raw.githubusercontent.com/mrdoob/three.js/dev/docs/pages/AONode.html via dry-run -->

# AONode

Source: https://raw.githubusercontent.com/mrdoob/three.js/dev/docs/pages/AONode.html

EventDispatcher → Node → LightingNode → 
 AONode 

 A generic class that can be used by nodes which contribute
ambient occlusion to the scene. E.g. an ambient occlusion map
node can be used as input for this module. Used in NodeMaterial . 

 Constructor 
 new AONode ( aoNode : Node .<float> ) 

 Constructs a new AO node. 

 aoNode 

 The ambient occlusion node. 
 Default is null . 

 Properties 
 
 . aoNode : Node .<float> 
 
 The ambient occlusion node. 
 Default is null . 

 Source 
 
 src/nodes/lighting/AONode.js

