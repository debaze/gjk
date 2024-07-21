import {PI, Vector2, Vector3} from "../math/index.js";
import {Geometry} from "./Geometry.js";

/**
 * @typedef {Object} CircleGeometryDescriptor
 * @property {Number} radius
 */

export class CircleGeometry extends Geometry {
	#radius;

	/**
	 * @param {CircleGeometryDescriptor} descriptor
	 */
	constructor(descriptor) {
		super();

		this.#radius = descriptor.radius;
	}

	/**
	 * @param {Vector3} D Direction
	 */
	support(D) {
		return new Vector3(D[0], D[1], 0)
			.normalize()
			.multiplyScalar(this.#radius);
	}

	/**
	 * @param {CanvasRenderingContext2D} context
	 * @param {Vector2} C Center
	 * @param {Vector2} O Origin
	 */
	render(context, C, O) {
		const position = new Vector3(
			C[0] + O[0],
			-C[1] + O[1],
			0,
		);

		context.beginPath();
		context.arc(position[0], position[1], this.#radius, 0, PI * 2);
	}
}