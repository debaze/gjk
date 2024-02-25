import {Vector2} from "../math/index.js";

/**
 * @abstract
 */
export class Shape {
	/**
	 * @type {Vector2}
	 */
	#position;

	/**
	 * @param {Vector2} position
	 */
	constructor(position) {
		this.#position = position;
	}

	getPosition() {
		return this.#position;
	}

	/**
	 * @param {CanvasRenderingContext2D} ctx
	 */
	render(ctx) {}
}