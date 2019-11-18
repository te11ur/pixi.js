import './polyfill/src';

import {AccessibilityManager} from "./accessibility/src/AccessibilityManager";
//import {Extract} from "./extract/src/Extract";
import {InteractionManager} from "./interaction/src/InteractionManager";
//import {Prepare} from "./prepare/src/Prepare";
import {Application} from "./app/src/Application";
import {Renderer} from "./core/src/Renderer";
import {BatchRenderer} from "./core/src/batch/BatchPluginFactory";
//import {AppLoaderPlugin, Loader} from "./loaders/src";
//import './mixin-cache-as-bitmap/src';
//import './mixin-get-child-by-name/src';
import './mixin-get-global-position/src';

//import {ParticleRenderer} from "./particles/src/ParticleRenderer";
//import {TilingSpriteRenderer} from "./sprite-tiling/src/TilingSpriteRenderer";

import {ResizePlugin} from "./app/src/ResizePlugin";
import {TickerPlugin} from "./ticker/src/TickerPlugin";
import {Graphics} from "./graphics/src/Graphics";

//import {SpritesheetLoader} from "./spritesheet/src/SpritesheetLoader";
//import {BitmapFontLoader} from "./text-bitmap/src/BitmapFontLoader";

// Install renderer plugins
Renderer.registerPlugin('accessibility', AccessibilityManager);
//Renderer.registerPlugin('extract', Extract);
Renderer.registerPlugin('interaction', InteractionManager);
//Renderer.registerPlugin('particle', ParticleRenderer);
//Renderer.registerPlugin('prepare', Prepare);
Renderer.registerPlugin('batch', BatchRenderer);
//Renderer.registerPlugin('tilingSprite', TilingSpriteRenderer);

//Loader.registerPlugin(BitmapFontLoader);
//Loader.registerPlugin(SpritesheetLoader);

Application.registerPlugin(ResizePlugin);
Application.registerPlugin(TickerPlugin);
//Application.registerPlugin(AppLoaderPlugin);

const app = new Application({
    backgroundColor: 0x05d4c1,
    antialias: true,
    resizeTo: window,
    resolution: window.devicePixelRatio || 1,
});
const g = app.stage.addChild(new Graphics());
g.beginFill(0xff00ff);
g.drawRoundedRect(0, 0, 200, 200, 20);
g.endFill();
document.body.appendChild(app.view);

app.ticker.add(dt => {
});
