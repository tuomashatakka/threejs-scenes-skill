<!-- ingested from https://threejs.org/manual/en/installation.html (direct markdown, no model) -->

Installation 

 Project structure 

 Every three.js project needs at least one HTML file to define the webpage, and a JavaScript file to run your three.js code. The structure and naming choices below aren't required, but will be used throughout this guide for consistency.

 index.html 


```js
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>My first three.js app</title>
    <style>
      body { margin: 0; }
    </style>
  </head>
  <body>
    <script type="module" src="/main.js"></script>
  </body>
</html>
```



 main.js 


```js
import * as THREE from 'three';

...
```



 public/ 

 The public/ folder is sometimes also called a "static" folder, because the files it contains are pushed to the website unchanged. Usually textures, audio, and 3D models will go here.

 Now that we've set up the basic project structure, we need a way to run the project locally and access it through a web browser. Installation and local development can be accomplished with npm and a build tool, or by importing three.js from a CDN. Both options are explained in the sections below.

 Option 1: Install with NPM and a build tool 

 Development 

 Installing from the [link:https://www.npmjs.com/ npm package registry] and using a [link:https://eloquentjavascript.net/10_modules.html#h_zWTXAU93DC build tool] is the recommended approach for most users — the more dependencies your project needs, the more likely you are to run into problems that the static hosting cannot easily resolve. With a build tool, importing local JavaScript files and npm packages should work out of the box, without import maps.

 Install [link:https://nodejs.org/ Node.js]. We'll need it to manage dependencies and to run our build tool.

 Install three.js and a build tool, [link:https://vitejs.dev/ Vite], using a [link:https://www.joshwcomeau.com/javascript/terminal-for-js-devs/ terminal] in your project folder. Vite will be used during development, but it isn't part of the final webpage. If you prefer to use another build tool, that's fine — we support modern build tools that can import [link:https://eloquentjavascript.net/10_modules.html#h_zWTXAU93DC ES Modules].
 


```js
# three.js
npm install --save three

# vite
npm install --save-dev vite
```



 Installation added node_modules/ and package.json to my project. What are they? 
 
 npm uses package.json to describe which versions of each dependency you've installed. If you have other people working on the project with you, they can install the original versions of each dependency simply by running npm install . If you're using version history, commit package.json .

 npm installs the code for each dependency in a new node_modules/ folder. When Vite builds your application, it sees imports for 'three' and pulls three.js files automatically from this folder. The node_modules/ folder is used only during development, and shouldn't be uploaded to your web hosting provider or committed to version history.

 Improve your editor auto-completion with jsconfig or tsconfig 
 
 Place a jsconfig.json (or tsconfig.json for TypeScript projects) in your project's root. Adding the configuration below helps your editor locate three.js files for enhanced auto-completion.
 


```js
{
  "compilerOptions": {
    // other options...
    "paths": {
      "three/webgpu": ["node_modules/three/build/three.webgpu.js"],
      "three/tsl": ["node_modules/three/build/three.tsl.js"],
    },
  }
}
```



 From your terminal, run:


```js
npx vite
```



 What is npx ? 
 
 npx is installed with Node.js, and runs command line programs like Vite so that you don't have to search for the right file in node_modules/ yourself. If you prefer, you can put [link:https://vitejs.dev/guide/#command-line-interface Vite's common commands] into the [link:https://docs.npmjs.com/cli/v9/using-npm/scripts package.json:scripts] list, and use npm run dev instead.

 If everything went well, you'll see a URL like http://localhost:5173 appear in your terminal, and can open that URL to see your web application.

 The page will be blank — you're ready to create a scene .

 If you want to learn more about these tools before you continue, see:

 [link:https://threejs-journey.com/lessons/local-server three.js journey: Local Server]

 [link:https://vitejs.dev/guide/cli.html Vite: Command Line Interface]

 [link:https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Understanding_client-side_tools/Package_management MDN: Package management basics]

 Production 

 Later, when you're ready to deploy your web application, you'll just need to tell Vite to run a production build — npx vite build . Everything used by the application will be compiled, optimized, and copied into the dist/ folder. The contents of that folder are ready to be hosted on your website.

 Option 2: Import from a CDN 

 Development 

 Installing without build tools will require some changes to the project structure given above. 

 We imported code from 'three' (an npm package) in main.js , and web browsers don't know what that means. In index.html we'll need to add an [link:https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap import map] defining where to get the package. Put the code below inside the <head>&lt/head> tag, after the styles.
 


```js
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@<version>/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@<version>/examples/jsm/"
  }
}
</script>
```


 
 Don't forget to replace <version> with an actual version of three.js, like "v0.149.0" . The most recent version can be found on the [link:https://www.npmjs.com/package/three?activeTab=versions npm version list].

 We'll also need to run a local server to host these files at URL where the web browser can access them. While it's technically possible to double-click an HTML file and open it in your browser, important features that we'll later implement, do not work when the page is opened this way, for security reasons.

 Install [link:https://nodejs.org/ Node.js], then run [link:https://www.npmjs.com/package/serve serve] to start a local server in the project's directory:
 


```js
npx serve .
```



 If everything went well, you'll see a URL like http://localhost:3000 appear in your terminal, and can open that URL to see your web application.

 The page will be blank — you're ready to [link:#manual/introduction/Creating-a-scene create a scene].

 Many other local static servers are available — some use different languages instead of Node.js, and others are desktop applications. They all work basically the same way, and we've provided a few alternatives below.

 More local servers 

 Command Line 

 Command line local servers run from a terminal window. The associated programming language may need to be installed first. 

 npx http-server (Node.js) 
 npx five-server (Node.js) 
 python -m SimpleHTTPServer (Python 2.x) 
 python -m http.server (Python 3.x) 
 php -S localhost:8000 (PHP 5.4+) 

 GUI 

 GUI local servers run as an application window on your computer, and may have a user interface. 

 [link:https://greggman.github.io/servez Servez] 

 Code Editor Plugins 

 Some code editors have plugins that spawn a simple server on demand. 

 [link:https://marketplace.visualstudio.com/items?itemName=yandeu.five-server Five Server] for Visual Studio Code 
 [link:https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer Live Server] for Visual Studio Code 
 [link:https://atom.io/packages/atom-live-server Live Server] for Atom 

 Production 

 When you're ready to deploy your web application, push the source files to your web hosting provider — no need to build or compile anything. The downside of that tradeoff is that you'll need to be careful to keep the import map updated with any dependencies (and dependencies of dependencies!) that your application requires. If the CDN hosting your dependencies goes down temporarily, your website will stop working too.

 IMPORTANT: Import all dependencies from the same version of three.js, and from the same CDN. Mixing files from different sources may cause duplicate code to be included, or even break the application in unexpected ways. 

 Addons 

 Out of the box, three.js includes the fundamentals of a 3D engine. Other three.js components — such as controls, loaders, and post-processing effects — are part of the [link:https://github.com/mrdoob/three.js/tree/dev/examples/jsm addons/] directory. Addons do not need to be installed separately, but do need to be imported separately.

 The example below shows how to import three.js with the `OrbitControls` and `GLTFLoader` addons. Where necessary, this will also be mentioned in each addon's documentation or examples.



```js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const controls = new OrbitControls( camera, renderer.domElement );
const loader = new GLTFLoader();
```



 Some excellent third-party projects are available for three.js, too. These need to be installed separately — see Libraries and Plugins .

 Next Steps 

 You're now ready to create a scene .
