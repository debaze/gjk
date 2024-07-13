import {Vector2, Vector3} from "../math/index.js";

/**
 * @typedef {Object} GeometryDescriptor
 * @property {Vector3} position
 */

/**
 * @abstract
 */
export class Geometry {
	#position;

	/**
	 * @param {GeometryDescriptor} descriptor
	 */
	constructor(descriptor) {
		this.#position = descriptor.position;
	}

	getPosition() {
		return this.#position;
	}

	/**
	 * @param {Vector3} position
	 */
	setPosition(position) {
		this.#position.set(position);
	}

	/**
	 * @abstract
	 * @param {Vector3} D
	 * @returns {Vector3}
	 */
	support(D) {
		throw new Error("Not implemented");
	}

	/**
	 * @abstract
	 * @param {CanvasRenderingContext2D} context
	 * @param {Vector2} O
	 */
	render(context, O) {
		throw new Error("Not implemented");
	}
}