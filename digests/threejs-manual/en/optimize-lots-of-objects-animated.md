<!-- ingested from https://threejs.org/manual/en/optimize-lots-of-objects-animated.html (direct markdown, no model) -->

Optimize Lots of Objects Animated 

 This article is a continuation of an article about optimizing lots of objects
 . If you haven't read that
yet please read it before proceeding. 
 In the previous article we merged around 19000 cubes into a
single geometry. This had the advantage that it optimized our drawing
of 19000 cubes but it had the disadvantage of make it harder to
move any individual cube. 
 Depending on what we are trying to accomplish there are different solutions.
In this case let's graph multiple sets of data and animate between the sets. 
 The first thing we need to do is get multiple sets of data. Ideally we'd
probably pre-process data offline but in this case let's load 2 sets of
data and generate 2 more 
 Here's our old loading code 


```js
loadFile('resources/data/gpw/gpw_v4_basic_demographic_characteristics_rev10_a000_014mt_2010_cntm_1_deg.asc')
  .then(parseData)
  .then(addBoxes)
  .then(render);
```


 Let's change it to something like this 


```js
async function loadData(info) {
  const text = await loadFile(info.url);
  info.file = parseData(text);
}

async function loadAll() {
  const fileInfos = [
    {name: 'men',   hueRange: [0.7, 0.3], url: 'resources/data/gpw/gpw_v4_basic_demographic_characteristics_rev10_a000_014mt_2010_cntm_1_deg.asc' },
    {name: 'women', hueRange: [0.9, 1.1], url: 'resources/data/gpw/gpw_v4_basic_demographic_characteristics_rev10_a000_014ft_2010_cntm_1_deg.asc' },
  ];

  await Promise.all(fileInfos.map(loadData));

  ...
}
loadAll();
```


 The code above will load all the files in fileInfos and when done each object
in fileInfos will have a file property with the loaded file. name and hueRange 
we'll use later. name will be for a UI field. hueRange will be used to
choose a range of hues to map over. 
 The two files above are apparently the number of men per area and the number of
women per area as of 2010. Note, I have no idea if this data is correct but
it's not important really. The important part is showing different sets
of data. 
 Let's generate 2 more sets of data. One being the places where the number
men are greater than the number of women and vice versa, the places where
the number of women are greater than the number of men. 
 The first thing let's write a function that given a 2 dimensional array
of arrays like we had before will map over it to generate a new 2 dimensional
array of arrays 


```js
function mapValues(data, fn) {
  return data.map((row, rowNdx) => {
    return row.map((value, colNdx) => {
      return fn(value, rowNdx, colNdx);
    });
  });
}
```


 Like the normal Array.map function the mapValues function calls a function
 fn for each value in the array of arrays. It passes it the value and both the
row and column indices. 
 Now let's make some code to generate a new file that is a comparison between 2
files 


```js
function makeDiffFile(baseFile, otherFile, compareFn) {
  let min;
  let max;
  const baseData = baseFile.data;
  const otherData = otherFile.data;
  const data = mapValues(baseData, (base, rowNdx, colNdx) => {
    const other = otherData[rowNdx][colNdx];
      if (base === undefined || other === undefined) {
        return undefined;
      }
      const value = compareFn(base, other);
      min = Math.min(min === undefined ? value : min, value);
      max = Math.max(max === undefined ? value : max, value);
      return value;
  });
  // make a copy of baseFile and replace min, max, and data
  // with the new data
  return {...baseFile, min, max, data};
}
```


 The code above uses mapValues to generate a new set of data that is
a comparison based on the compareFn function passed in. It also tracks
the min and max comparison results. Finally it makes a new file with
all the same properties as baseFile except with a new min , max and data . 
 Then let's use that to make 2 new sets of data 


```js
{
  const menInfo = fileInfos[0];
  const womenInfo = fileInfos[1];
  const menFile = menInfo.file;
  const womenFile = womenInfo.file;

  function amountGreaterThan(a, b) {
    return Math.max(a - b, 0);
  }
  fileInfos.push({
    name: '>50%men',
    hueRange: [0.6, 1.1],
    file: makeDiffFile(menFile, womenFile, (men, women) => {
      return amountGreaterThan(men, women);
    }),
  });
  fileInfos.push({
    name: '>50% women',
    hueRange: [0.0, 0.4],
    file: makeDiffFile(womenFile, menFile, (women, men) => {
      return amountGreaterThan(women, men);
    }),
  });
}
```


 Now let's generate a UI to select between these sets of data. First we need
some UI html 


```js
<body>
  <canvas id="c"></canvas>
+  <div id="ui"></div>
</body>
```


 and some CSS to make it appear in the top left area 


```js
#ui {
  position: absolute;
  left: 1em;
  top: 1em;
}
#ui>div {
  font-size: 20pt;
  padding: 1em;
  display: inline-block;
}
#ui>div.selected {
  color: red;
}
```


 Then we can go over each file and generate a set of merged boxes per
set of data and an element which when hovered over will show that set
and hide all others. 


```js
// show the selected data, hide the rest
function showFileInfo(fileInfos, fileInfo) {
  fileInfos.forEach((info) => {
    const visible = fileInfo === info;
    info.root.visible = visible;
    info.elem.className = visible ? 'selected' : '';
  });
  requestRenderIfNotRequested();
}

const uiElem = document.querySelector('#ui');
fileInfos.forEach((info) => {
  const boxes = addBoxes(info.file, info.hueRange);
  info.root = boxes;
  const div = document.createElement('div');
  info.elem = div;
  div.textContent = info.name;
  uiElem.appendChild(div);
  div.addEventListener('mouseover', () => {
    showFileInfo(fileInfos, info);
  });
});
// show the first set of data
showFileInfo(fileInfos, fileInfos[0]);
```


 The one more change we need from the previous example is we need to make
 addBoxes take a hueRange 


```js
-function addBoxes(file) {
+function addBoxes(file, hueRange) {

  ...

    // compute a color
-    const hue = THREE.MathUtils.lerp(0.7, 0.3, amount);
+    const hue = THREE.MathUtils.lerp(...hueRange, amount);

  ...
```


 and with that we should be able to show 4 sets of data. Hover the mouse over the labels
or touch them to switch sets 

 click here to open in a separate window 

 Note, there are a few strange data points that really stick out. I wonder what's up
with those!??! In any case how do we animate between these 4 sets of data. 
 Lots of ideas. 
 
 Just fade between them using Material.opacity 
 The problem with this solution is the cubes perfectly overlap which
means there will be z-fighting issues. It's possible we could fix
that by changing the depth function and using blending. We should
probably look into it. 
 
 Scale up the set we want to see and scale down the other sets 
 Because all the boxes have their origin at the center of the planet
if we scale them below 1.0 they will sink into the planet. At first that
sounds like a good idea but the issue is all the low height boxes
will disappear almost immediately and not be replaced until the new
data set scales up to 1.0. This makes the transition not very pleasant.
We could maybe fix that with a fancy custom shader. 
 
 Use Morphtargets 
 Morphtargets are a way were we supply multiple values for each vertex
in the geometry and morph or lerp (linear interpolate) between them.
Morphtargets are most commonly used for facial animation of 3D characters
but that's not their only use. 

 Let's try morphtargets. 
 We'll still make a geometry for each set of data but we'll then extract
the position attribute from each one and use them as morphtargets. 
 First let's change addBoxes to just make and return the merged geometry. 


```js
-function addBoxes(file, hueRange) {
+function makeBoxes(file, hueRange) {
  const {min, max, data} = file;
  const range = max - min;

  ...

-  const mergedGeometry = BufferGeometryUtils.mergeGeometries(
-      geometries, false);
-  const material = new THREE.MeshBasicMaterial({
-    vertexColors: true,
-  });
-  const mesh = new THREE.Mesh(mergedGeometry, material);
-  scene.add(mesh);
-  return mesh;
+  return BufferGeometryUtils.mergeGeometries(
+     geometries, false);
}
```


 There's one more thing we need to do here though. Morphtargets are required to
all have exactly the same number of vertices. Vertex #123 in one target needs
have a corresponding Vertex #123 in all other targets. But, as it is now
different data sets might have some data points with no data so no box will be
generated for that point which would mean no corresponding vertices for another
set. So, we need to check across all data sets and either always generate
something if there is data in any set or, generate nothing if there is data
missing in any set. Let's do the latter. 


```js
+function dataMissingInAnySet(fileInfos, latNdx, lonNdx) {
+  for (const fileInfo of fileInfos) {
+    if (fileInfo.file.data[latNdx][lonNdx] === undefined) {
+      return true;
+    }
+  }
+  return false;
+}

-function makeBoxes(file, hueRange) {
+function makeBoxes(file, hueRange, fileInfos) {
  const {min, max, data} = file;
  const range = max - min;

  ...

  const geometries = [];
  data.forEach((row, latNdx) => {
    row.forEach((value, lonNdx) => {
+      if (dataMissingInAnySet(fileInfos, latNdx, lonNdx)) {
+        return;
+      }
      const amount = (value - min) / range;

  ...
```


 Now we'll change the code that was calling addBoxes to use makeBoxes 
and setup morphtargets 


```js
+// make geometry for each data set
+const geometries = fileInfos.map((info) => {
+  return makeBoxes(info.file, info.hueRange, fileInfos);
+});
+
+// use the first geometry as the base
+// and add all the geometries as morphtargets
+const baseGeometry = geometries[0];
+baseGeometry.morphAttributes.position = geometries.map((geometry, ndx) => {
+  const attribute = geometry.getAttribute('position');
+  const name = `target${ndx}`;
+  attribute.name = name;
+  return attribute;
+});
+baseGeometry.morphAttributes.color = geometries.map((geometry, ndx) => {
+  const attribute = geometry.getAttribute('color');
+  const name = `target${ndx}`;
+  attribute.name = name;
+  return attribute;
+});
+const material = new THREE.MeshBasicMaterial({
+  vertexColors: true,
+});
+const mesh = new THREE.Mesh(baseGeometry, material);
+scene.add(mesh);

const uiElem = document.querySelector('#ui');
fileInfos.forEach((info) => {
-  const boxes = addBoxes(info.file, info.hueRange);
-  info.root = boxes;
  const div = document.createElement('div');
  info.elem = div;
  div.textContent = info.name;
  uiElem.appendChild(div);
  function show() {
    showFileInfo(fileInfos, info);
  }
  div.addEventListener('mouseover', show);
  div.addEventListener('touchstart', show);
});
// show the first set of data
showFileInfo(fileInfos, fileInfos[0]);
```


 Above we make geometry for each data set, use the first one as the base,
then get a position attribute from each geometry and add it as
a morphtarget to the base geometry for position . 
 Now we need to change how we're showing and hiding the various data sets.
Instead of showing or hiding a mesh we need to change the influence of the
morphtargets. For the data set we want to see we need to have an influence of 1
and for all the ones we don't want to see to we need to have an influence of 0. 
 We could just set them to 0 or 1 directly but if we did that we wouldn't see any
animation, it would just snap which would be no different than what we already
have. We could also write some custom animation code which would be easy but
because the original webgl globe uses
 an animation library let's use the same one here. 
 We need to include the library 


```js
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
+import TWEEN from 'three/addons/libs/tween.module.js';
```


 And then create a Tween to animate the influences. 


```js
// show the selected data, hide the rest
function showFileInfo(fileInfos, fileInfo) {
+  const targets = {};
-  fileInfos.forEach((info) => {
+  fileInfos.forEach((info, i) => {
    const visible = fileInfo === info;
-    info.root.visible = visible;
    info.elem.className = visible ? 'selected' : '';
+    targets[i] = visible ? 1 : 0;
  });
+  const durationInMs = 1000;
+  new TWEEN.Tween(mesh.morphTargetInfluences)
+    .to(targets, durationInMs)
+    .start();
  requestRenderIfNotRequested();
}
```


 We're also suppose to call TWEEN.update every frame inside our render loop
but that points out a problem. "tween.js" is designed for continuous rendering
but we are rendering on demand . We could
switch to continuous rendering but it's sometimes nice to only render on demand
as it well stop using the user's power when nothing is happening
so let's see if we can make it animate on demand. 
 We'll make a TweenManager to help. We'll use it to create the Tween s and
track them. It will have an update method that will return true 
if we need to call it again and false if all the animations are finished. 


```js
class TweenManger {
  constructor() {
    this.numTweensRunning = 0;
  }
  _handleComplete() {
    --this.numTweensRunning;
    console.assert(this.numTweensRunning >= 0);
  }
  createTween(targetObject) {
    const self = this;
    ++this.numTweensRunning;
    let userCompleteFn = () => {};
    // create a new tween and install our own onComplete callback
    const tween = new TWEEN.Tween(targetObject).onComplete(function(...args) {
      self._handleComplete();
      userCompleteFn.call(this, ...args);
    });
    // replace the tween's onComplete function with our own
    // so we can call the user's callback if they supply one.
    tween.onComplete = (fn) => {
      userCompleteFn = fn;
      return tween;
    };
    return tween;
  }
  update() {
    TWEEN.update();
    return this.numTweensRunning > 0;
  }
}
```


 To use it we'll create one 


```js
function main() {
  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
+  const tweenManager = new TweenManger();

  ...
```


 We'll use it to create our Tween s. 


```js
// show the selected data, hide the rest
function showFileInfo(fileInfos, fileInfo) {
  const targets = {};
  fileInfos.forEach((info, i) => {
    const visible = fileInfo === info;
    info.elem.className = visible ? 'selected' : '';
    targets[i] = visible ? 1 : 0;
  });
  const durationInMs = 1000;
-  new TWEEN.Tween(mesh.morphTargetInfluences)
+  tweenManager.createTween(mesh.morphTargetInfluences)
    .to(targets, durationInMs)
    .start();
  requestRenderIfNotRequested();
}
```


 Then we'll update our render loop to update the tweens and keep rendering
if there are still animations running. 


```js
function render() {
  renderRequested = false;

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

+  if (tweenManager.update()) {
+    requestRenderIfNotRequested();
+  }

  controls.update();
  renderer.render(scene, camera);
}
render();
```


 And with that we should be animating between data sets. 

 click here to open in a separate window 

 I hope going through this was helpful. Using morphtargets is a common technique to
move lots of objects. As an example we could give every cube a random place in
another target and morph from that to their first positions on the globe. That
might be a cool way to introduce the globe. 
 Next you might be interested in adding labels to a globe which is covered
in Aligning HTML Elements to 3D . 
 Note: We could try to just graph percent of men or percent of women or the raw
difference but based on how we are displaying the info, cubes that grow from the
surface of the earth, we'd prefer most cubes to be low. If we used one of these
other comparisons most cubes would be about 1/2 their maximum height which would
not make a good visualization. Feel free to change the amountGreaterThan from
 Math.max(a - b, 0) to something like (a - b) "raw difference" or a / (a +
b) "percent" and you'll see what I mean.
