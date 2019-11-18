import {hex2rgb, hex2string} from "../../utils/src/color/hex";
//import {deprecation} from "../../utils/src/logging/deprecation";
import {Matrix} from "../../math/src/Matrix";
import {Rectangle} from "../../math/src/shapes/Rectangle";
import {RENDERER_TYPE} from "../../constants/src";
import {settings} from "../../settings/src/settings";
import {Container} from "../../display/src/Container";
import { RenderTexture } from './renderTexture/RenderTexture';
import EventEmitter from "eventemitter3";

const tempMatrix = new Matrix();

/**
 * The AbstractRenderer is the base for a PixiJS Renderer. It is extended by the {@link PIXI.CanvasRenderer}
 * and {@link PIXI.Renderer} which can be used for rendering a PixiJS scene.
 *
 * @abstract
 * @class
 * @extends PIXI.utils.EventEmitter
 * @memberof PIXI
 */
export class AbstractRenderer extends EventEmitter
{
    /**
     * @param {string} system - The name of the system this renderer is for.
     * @param {object} [options] - The optional renderer parameters.
     * @param {number} [options.width=800] - The width of the screen.
     * @param {number} [options.height=600] - The height of the screen.
     * @param {HTMLCanvasElement} [options.view] - The canvas to use as a view, optional.
     * @param {boolean} [options.transparent=false] - If the render view is transparent.
     * @param {boolean} [options.autoDensity=false] - Resizes renderer view in CSS pixels to allow for
     *   resolutions other than 1.
     * @param {boolean} [options.antialias=false] - Sets antialias
     * @param {number} [options.resolution=1] - The resolution / device pixel ratio of the renderer. The
     *  resolution of the renderer retina would be 2.
     * @param {boolean} [options.preserveDrawingBuffer=false] - Enables drawing buffer preservation,
     *  enable this if you need to call toDataUrl on the WebGL context.
     * @param {boolean} [options.clearBeforeRender=true] - This sets if the renderer will clear the canvas or
     *      not before the new render pass.
     * @param {number} [options.backgroundColor=0x000000] - The background color of the rendered area
     *  (shown if not transparent).
     */
    constructor(system, options)
    {
        super();

        // Add the default render options
        options = Object.assign({}, settings.RENDER_OPTIONS, options);

        // Deprecation notice for renderer roundPixels option
       /* if (options.roundPixels)
        {
            settings.ROUND_PIXELS = options.roundPixels;
            deprecation('5.0.0', 'Renderer roundPixels option is deprecated, please use PIXI.settings.ROUND_PIXELS', 2);
        }*/

        /**
         * The supplied constructor options.
         *
         * @member {Object}
         * @readOnly
         */
        this.options = options;

        /**
         * The type of the renderer.
         *
         * @member {number}
         * @default PIXI.RENDERER_TYPE.UNKNOWN
         * @see PIXI.RENDERER_TYPE
         */
        this.type = RENDERER_TYPE.UNKNOWN;

        /**
         * Measurements of the screen. (0, 0, screenWidth, screenHeight).
         *
         * Its safe to use as filterArea or hitArea for the whole stage.
         *
         * @member {PIXI.Rectangle}
         */
        this.screen = new Rectangle(0, 0, options.width, options.height);

        /**
         * The canvas element that everything is drawn to.
         *
         * @member {HTMLCanvasElement}
         */
        this.view = options.view || document.createElement('canvas');

        /**
         * The resolution / device pixel ratio of the renderer.
         *
         * @member {number}
         * @default 1
         */
        this.resolution = options.resolution || settings.RESOLUTION;

        /**
         * Whether the render view is transparent.
         *
         * @member {boolean}
         */
        this.transparent = options.transparent;

        /**
         * Whether CSS dimensions of canvas view should be resized to screen dimensions automatically.
         *
         * @member {boolean}
         */
        this.autoDensity = options.autoDensity || options.autoResize || false;
        // autoResize is deprecated, provides fallback support

        /**
         * The value of the preserveDrawingBuffer flag affects whether or not the contents of
         * the stencil buffer is retained after rendering.
         *
         * @member {boolean}
         */
        this.preserveDrawingBuffer = options.preserveDrawingBuffer;

        /**
         * This sets if the CanvasRenderer will clear the canvas or not before the new render pass.
         * If the scene is NOT transparent PixiJS will use a canvas sized fillRect operation every
         * frame to set the canvas background color. If the scene is transparent PixiJS will use clearRect
         * to clear the canvas every frame. Disable this by setting this to false. For example, if
         * your game has a canvas filling background image you often don't need this set.
         *
         * @member {boolean}
         * @default
         */
        this.clearBeforeRender = options.clearBeforeRender;

        /**
         * The background color as a number.
         *
         * @member {number}
         * @protected
         */
        this._backgroundColor = 0x000000;

        /**
         * The background color as an [R, G, B] array.
         *
         * @member {number[]}
         * @protected
         */
        this._backgroundColorRgba = [0, 0, 0, 0];

        /**
         * The background color as a string.
         *
         * @member {string}
         * @protected
         */
        this._backgroundColorString = '#000000';

        this.backgroundColor = options.backgroundColor || this._backgroundColor; // run bg color setter

        /**
         * This temporary display object used as the parent of the currently being rendered item.
         *
         * @member {PIXI.DisplayObject}
         * @protected
         */
        this._tempDisplayObjectParent = new Container();

        /**
         * The last root object that the renderer tried to render.
         *
         * @member {PIXI.DisplayObject}
         * @protected
         */
        this._lastObjectRendered = this._tempDisplayObjectParent;

        /**
         * Collection of plugins.
         * @readonly
         * @member {object}
         */
        this.plugins = {};
    }

    /**
     * Initialize the plugins.
     *
     * @protected
     * @param {object} staticMap - The dictionary of statically saved plugins.
     */
    initPlugins(staticMap)
    {
        for (const o in staticMap)
        {
            this.plugins[o] = new (staticMap[o])(this);
        }
    }

    /**
     * Same as view.width, actual number of pixels in the canvas by horizontal.
     *
     * @member {number}
     * @readonly
     * @default 800
     */
    get width()
    {
        return this.view.width;
    }

    /**
     * Same as view.height, actual number of pixels in the canvas by vertical.
     *
     * @member {number}
     * @readonly
     * @default 600
     */
    get height()
    {
        return this.view.height;
    }

    /**
     * Resizes the screen and canvas to the specified width and height.
     * Canvas dimensions are multiplied by resolution.
     *
     * @param {number} screenWidth - The new width of the screen.
     * @param {number} screenHeight - The new height of the screen.
     */
    resize(screenWidth, screenHeight)
    {
        this.screen.width = screenWidth;
        this.screen.height = screenHeight;

        this.view.width = screenWidth * this.resolution;
        this.view.height = screenHeight * this.resolution;

        if (this.autoDensity)
        {
            this.view.style.width = `${screenWidth}px`;
            this.view.style.height = `${screenHeight}px`;
        }
    }

    /**
     * Useful function that returns a texture of the display object that can then be used to create sprites
     * This can be quite useful if your displayObject is complicated and needs to be reused multiple times.
     *
     * @param {PIXI.DisplayObject} displayObject - The displayObject the object will be generated from.
     * @param {number} scaleMode - Should be one of the scaleMode consts.
     * @param {number} resolution - The resolution / device pixel ratio of the texture being generated.
     * @param {PIXI.Rectangle} [region] - The region of the displayObject, that shall be rendered,
     *        if no region is specified, defaults to the local bounds of the displayObject.
     * @return {PIXI.RenderTexture} A texture of the graphics object.
     */
    generateTexture(displayObject, scaleMode, resolution, region)
    {
        region = region || displayObject.getLocalBounds();

        // minimum texture size is 1x1, 0x0 will throw an error
        if (region.width === 0) region.width = 1;
        if (region.height === 0) region.height = 1;

        const renderTexture = RenderTexture.create(region.width | 0, region.height | 0, scaleMode, resolution);

        tempMatrix.tx = -region.x;
        tempMatrix.ty = -region.y;

        this.render(displayObject, renderTexture, false, tempMatrix, !!displayObject.parent);

        return renderTexture;
    }

    /**
     * Removes everything from the renderer and optionally removes the Canvas DOM element.
     *
     * @param {boolean} [removeView=false] - Removes the Canvas element from the DOM.
     */
    destroy(removeView)
    {
        for (const o in this.plugins)
        {
            this.plugins[o].destroy();
            this.plugins[o] = null;
        }

        if (removeView && this.view.parentNode)
        {
            this.view.parentNode.removeChild(this.view);
        }

        this.plugins = null;

        this.type = RENDERER_TYPE.UNKNOWN;

        this.view = null;

        this.screen = null;

        this.resolution = 0;

        this.transparent = false;

        this.autoDensity = false;

        this.blendModes = null;

        this.options = null;

        this.preserveDrawingBuffer = false;
        this.clearBeforeRender = false;

        this._backgroundColor = 0;
        this._backgroundColorRgba = null;
        this._backgroundColorString = null;

        this._tempDisplayObjectParent = null;
        this._lastObjectRendered = null;
    }

    /**
     * The background color to fill if not transparent
     *
     * @member {number}
     */
    get backgroundColor()
    {
        return this._backgroundColor;
    }

    set backgroundColor(value) // eslint-disable-line require-jsdoc
    {
        this._backgroundColor = value;
        this._backgroundColorString = hex2string(value);
        hex2rgb(value, this._backgroundColorRgba);
    }
}
