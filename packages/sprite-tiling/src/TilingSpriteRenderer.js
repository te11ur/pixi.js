import {Shader} from "../../core/src/shader/Shader";
import {ObjectRenderer} from "../../core/src/batch/ObjectRenderer";
import {QuadUv} from "../../core/src/utils/QuadUv";
import {WRAP_MODES} from "../../constants/src";
import {Matrix} from "../../math/src/Matrix";
import {correctBlendMode, premultiplyTintToRgba} from "../../utils/src/color/premultiply";

import vertex from './tilingSprite.vert';
import fragment from './tilingSprite.frag';
import fragmentSimple from './tilingSprite_simple.frag';

const tempMat = new Matrix();

/**
 * WebGL renderer plugin for tiling sprites
 *
 * @class
 * @memberof PIXI
 * @extends PIXI.ObjectRenderer
 */
export class TilingSpriteRenderer extends ObjectRenderer
{
    /**
     * constructor for renderer
     *
     * @param {PIXI.Renderer} renderer The renderer this tiling awesomeness works for.
     */
    constructor(renderer)
    {
        super(renderer);

        const uniforms = { globals: this.renderer.globalUniforms };

        this.shader = Shader.from(vertex, fragment, uniforms);

        this.simpleShader = Shader.from(vertex, fragmentSimple, uniforms);

        this.quad = new QuadUv();
    }

    /**
     *
     * @param {PIXI.TilingSprite} ts tilingSprite to be rendered
     */
    render(ts)
    {
        const renderer = this.renderer;
        const quad = this.quad;

        let vertices = quad.vertices;

        vertices[0] = vertices[6] = (ts._width) * -ts.anchor.x;
        vertices[1] = vertices[3] = ts._height * -ts.anchor.y;

        vertices[2] = vertices[4] = (ts._width) * (1.0 - ts.anchor.x);
        vertices[5] = vertices[7] = ts._height * (1.0 - ts.anchor.y);

        if (ts.uvRespectAnchor)
        {
            vertices = quad.uvs;

            vertices[0] = vertices[6] = -ts.anchor.x;
            vertices[1] = vertices[3] = -ts.anchor.y;

            vertices[2] = vertices[4] = 1.0 - ts.anchor.x;
            vertices[5] = vertices[7] = 1.0 - ts.anchor.y;
        }

        quad.invalidate();

        const tex = ts._texture;
        const baseTex = tex.baseTexture;
        const lt = ts.tileTransform.localTransform;
        const uv = ts.uvMatrix;
        let isSimple = baseTex.isPowerOfTwo
            && tex.frame.width === baseTex.width && tex.frame.height === baseTex.height;

        // auto, force repeat wrapMode for big tiling textures
        if (isSimple)
        {
            if (!baseTex._glTextures[renderer.CONTEXT_UID])
            {
                if (baseTex.wrapMode === WRAP_MODES.CLAMP)
                {
                    baseTex.wrapMode = WRAP_MODES.REPEAT;
                }
            }
            else
            {
                isSimple = baseTex.wrapMode !== WRAP_MODES.CLAMP;
            }
        }

        const shader = isSimple ? this.simpleShader : this.shader;

        const w = tex.width;
        const h = tex.height;
        const W = ts._width;
        const H = ts._height;

        tempMat.set(lt.a * w / W,
            lt.b * w / H,
            lt.c * h / W,
            lt.d * h / H,
            lt.tx / W,
            lt.ty / H);

        // that part is the same as above:
        // tempMat.identity();
        // tempMat.scale(tex.width, tex.height);
        // tempMat.prepend(lt);
        // tempMat.scale(1.0 / ts._width, 1.0 / ts._height);

        tempMat.invert();
        if (isSimple)
        {
            tempMat.prepend(uv.mapCoord);
        }
        else
        {
            shader.uniforms.uMapCoord = uv.mapCoord.toArray(true);
            shader.uniforms.uClampFrame = uv.uClampFrame;
            shader.uniforms.uClampOffset = uv.uClampOffset;
        }

        shader.uniforms.uTransform = tempMat.toArray(true);
        shader.uniforms.uColor = premultiplyTintToRgba(ts.tint, ts.worldAlpha,
            shader.uniforms.uColor, baseTex.alphaMode);
        shader.uniforms.translationMatrix = ts.transform.worldTransform.toArray(true);
        shader.uniforms.uSampler = tex;

        renderer.shader.bind(shader);
        renderer.geometry.bind(quad);// , renderer.shader.getGLShader());

        renderer.state.setBlendMode(correctBlendMode(ts.blendMode, baseTex.alphaMode));
        renderer.geometry.draw(this.renderer.gl.TRIANGLES, 6, 0);
    }
}
