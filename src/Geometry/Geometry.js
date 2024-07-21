import {Vector2, Vector3} from "../math/index.js";

/**
 * @abstract
 */
export class Geometry {
	#centerOfMass;

	constructor() {
		this.#centerOfMass = new Vector3(0, 0, 0);
	}

	getCenterOfMass() {
		return this.#centerOfMass;
	}

	/**
	 * @param {Vector3} centerOfMass
	 */
	_setCenterOfMass(centerOfMass) {
		this.#centerOfMass.set(centerOfMass);
	}

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