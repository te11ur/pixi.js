import { ObservablePoint } from './ObservablePoint';
import { Matrix } from './Matrix';

/**
 * Transform that takes care about its versions
 */
export class Transform
{
    /**
     * A default (identity) transform
     *
     * @static
     * @constant
     * @member {Transform}
     */
    static IDENTITY = new Transform();

    /**
     * The world transformation matrix.
     *
     * @member {Matrix}
     */
    worldTransform;

    /**
     * The local transformation matrix.
     *
     * @member {Matrix}
     */
    localTransform;

    /**
     * The coordinate of the object relative to the local coordinates of the parent.
     *
     * @member {ObservablePoint}
     */
    position;

    /**
     * The scale factor of the object.
     *
     * @member {ObservablePoint}
     */
    scale;

    /**
     * The pivot point of the displayObject that it rotates around.
     *
     * @member {ObservablePoint}
     */
    pivot;

    /**
     * The skew amount, on the x and y axis.
     *
     * @member {ObservablePoint}
     */
    skew;

    /**
     * The rotation amount.
     *
     * @protected
     * @member {number}
     */
    _rotation ;

    /**
     * The X-coordinate value of the normalized local X axis,
     * the first column of the local transformation matrix without a scale.
     *
     * @protected
     * @member {number}
     */
    _cx;

    /**
     * The Y-coordinate value of the normalized local X axis,
     * the first column of the local transformation matrix without a scale.
     *
     * @protected
     * @member {number}
     */
    _sx;

    /**
     * The X-coordinate value of the normalized local Y axis,
     * the second column of the local transformation matrix without a scale.
     *
     * @protected
     * @member {number}
     */
    _cy;

    /**
     * The Y-coordinate value of the normalized local Y axis,
     * the second column of the local transformation matrix without a scale.
     *
     * @protected
     * @member {number}
     */
    _sy;

    /**
     * The locally unique ID of the local transform.
     *
     * @protected
     * @member {number}
     */
    _localID;

    /**
     * The locally unique ID of the local transform
     * used to calculate the current local transformation matrix.
     *
     * @protected
     * @member {number}
     */
    _currentLocalID;

    /**
     * The locally unique ID of the world transform.
     *
     * @protected
     * @member {number}
     */
    _worldID;

    /**
     * The locally unique ID of the parent's world transform
     * used to calculate the current world transformation matrix.
     *
     * @protected
     * @member {number}
     */
    _parentID;

    constructor()
    {
        this.worldTransform = new Matrix();
        this.localTransform = new Matrix();
        this.position = new ObservablePoint(this.onChange, this, 0, 0);
        this.scale = new ObservablePoint(this.onChange, this, 1, 1);
        this.pivot = new ObservablePoint(this.onChange, this, 0, 0);
        this.skew = new ObservablePoint(this.updateSkew, this, 0, 0);
        this._rotation = 0;
        this._cx = 1;
        this._sx = 0;
        this._cy = 0;
        this._sy = 1;
        this._localID = 0;
        this._currentLocalID = 0;
        this._worldID = 0;
        this._parentID = 0;
    }

	copy(source) {
		this.worldTransform.copyFrom(source.worldTransform);
		this.localTransform.copyFrom(source.localTransform);
		this.position.copyFrom(source.position);
		this.scale.copyFrom(source.scale);
		this.pivot.copyFrom(source.pivot);
		this.pivot.copyFrom(source.pivot);
		this.skew.copyFrom(source.skew);
		return this;
	}

	clone() {
		return new this.constructor().copy(this);
	}

    /**
     * Called when a value changes.
     *
     * @protected
     */
    onChange()
    {
        this._localID++;
    }

    /**
     * Called when the skew or the rotation changes.
     *
     * @protected
     */
    updateSkew()
    {
        this._cx = Math.cos(this._rotation + this.skew.y);
        this._sx = Math.sin(this._rotation + this.skew.y);
        this._cy = -Math.sin(this._rotation - this.skew.x); // cos, added PI/2
        this._sy = Math.cos(this._rotation - this.skew.x); // sin, added PI/2

        this._localID++;
    }

    /**
     * Updates the local transformation matrix.
     */
    updateLocalTransform()
    {
        const lt = this.localTransform;

        if (this._localID !== this._currentLocalID)
        {
            // get the matrix values of the displayobject based on its transform properties..
            lt.a = this._cx * this.scale.x;
            lt.b = this._sx * this.scale.x;
            lt.c = this._cy * this.scale.y;
            lt.d = this._sy * this.scale.y;

            lt.tx = this.position.x - ((this.pivot.x * lt.a) + (this.pivot.y * lt.c));
            lt.ty = this.position.y - ((this.pivot.x * lt.b) + (this.pivot.y * lt.d));
            this._currentLocalID = this._localID;

            // force an update..
            this._parentID = -1;
        }
    }

    /**
     * Updates the local and the world transformation matrices.
     *
     * @param {Transform} parentTransform - The parent transform
     */
    updateTransform(parentTransform)
    {
        const lt = this.localTransform;

        if (this._localID !== this._currentLocalID)
        {
            // get the matrix values of the displayobject based on its transform properties..
            lt.a = this._cx * this.scale.x;
            lt.b = this._sx * this.scale.x;
            lt.c = this._cy * this.scale.y;
            lt.d = this._sy * this.scale.y;

            lt.tx = this.position.x - ((this.pivot.x * lt.a) + (this.pivot.y * lt.c));
            lt.ty = this.position.y - ((this.pivot.x * lt.b) + (this.pivot.y * lt.d));
            this._currentLocalID = this._localID;

            // force an update..
            this._parentID = -1;
        }

        if (this._parentID !== parentTransform._worldID)
        {
            // concat the parent matrix with the objects transform.
            const pt = parentTransform.worldTransform;
            const wt = this.worldTransform;

            wt.a = (lt.a * pt.a) + (lt.b * pt.c);
            wt.b = (lt.a * pt.b) + (lt.b * pt.d);
            wt.c = (lt.c * pt.a) + (lt.d * pt.c);
            wt.d = (lt.c * pt.b) + (lt.d * pt.d);
            wt.tx = (lt.tx * pt.a) + (lt.ty * pt.c) + pt.tx;
            wt.ty = (lt.tx * pt.b) + (lt.ty * pt.d) + pt.ty;

            this._parentID = parentTransform._worldID;

            // update the id of the transform..
            this._worldID++;
        }
    }

    /**
     * Decomposes a matrix and sets the transforms properties based on it.
     *
     * @param {Matrix} matrix - The matrix to decompose
     */
    setFromMatrix(matrix)
    {
        matrix.decompose(this);
        this._localID++;
    }

    /**
     * The rotation of the object in radians.
     *
     * @member {number}
     */
    get rotation()
    {
        return this._rotation;
    }

    set rotation(value) // eslint-disable-line require-jsdoc
    {
        if (this._rotation !== value)
        {
            this._rotation = value;
            this.updateSkew();
        }
    }
}
