import {PI, Vector2, Vector3} from "../math/index.js";
import {Geometry} from "./Geometry.js";

/**
 * @typedef {Object} CircleGeometryDescriptor
 * @property {Number} radius
 */

export class CircleGeometry extends Geometry {
	#radius;

	/**
	 * @param {import("./Geometry.js").GeometryDescriptor & CircleGeometryDescriptor} descriptor
	 */
	constructor(descriptor) {
		super(descriptor);

		this.#radius = descriptor.radius;
	}

	/**
	 * @param {Vector3} D
	 */
	support(D) {
		return new Vector3(D)
			.normalize()
			.multiplyScalar(this.#radius)
			.add(this.getPosition());
	}

	/**
	 * @param {CanvasRenderingContext2D} context
	 * @param {Vector2} O
	 */
	render(context, O) {
		const position = new Vector3(
			this.getPosition()[0] + O[0],
			-this.getPosition()[1] + O[1],
			0,
		);

		context.beginPath();
		context.arc(position[0], position[1], this.#radius, 0, PI * 2);
	}
}