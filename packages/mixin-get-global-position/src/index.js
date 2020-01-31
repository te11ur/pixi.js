import {DisplayObject} from "../../display/src/DisplayObject";
import {Point} from "../../math/src/Point";

/**
 * Returns the global position of the displayObject. Does not depend on object scale, rotation and pivot.
 *
 * @method getGlobalPosition
 * @memberof DisplayObject#
 * @param {Point} [point=new Point()] - The point to write the global value to.
 * @param {boolean} [skipUpdate=false] - Setting to true will stop the transforms of the scene graph from
 *  being updated. This means the calculation returned MAY be out of date BUT will give you a
 *  nice performance boost.
 * @return {Point} The updated point.
 */
DisplayObject.prototype.getGlobalPosition = function getGlobalPosition(point = new Point(), skipUpdate = false)
{
    if (this.parent)
    {
        this.parent.toGlobal(this.position, point, skipUpdate);
    }
    else
    {
        point.x = this.position.x;
        point.y = this.position.y;
    }

    return point;
};
