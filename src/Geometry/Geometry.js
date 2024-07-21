import {Vector2, Vector3} from "../math/index.js";

/**
 * @abstract
 */
export class Geometry {
	/**
	 * @abstract
	 * @param {Vector3} D Direction
	 * @returns {Vector3}
	 */
	support(D) {
		throw new Error("Not implemented");
	}

	/**
	 * @abstract
	 * @param {CanvasRenderingContext2D} context
	 * @param {Vector2} C Center
	 * @param {Vector2} O Origin
	 */
	render(context, C, O) {
		throw new Error("Not implemented");
	}
}