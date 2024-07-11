import {Vector2, Vector3} from "../math/index.js";

/**
 * @abstract
 */
export class Shape {
	/**
	 * @type {Vector3}
	 */
	#position;

	/**
	 * @type {String}
	 */
	#color;

	/**
	 * @param {Vector3} position
	 * @param {String} color
	 */
	constructor(position, color) {
		this.#position = position;
		this.#color = color;
	}

	getPosition() {
		return this.#position;
	}

	/**
	 * @param {Vector3} position
	 */
	setPosition(position) {
		this.#position = position;
	}

	getColor() {
		return this.#color;
	}

	/**
	 * @abstract
	 * @param {Vector3} direction
	 * @returns {Vector3}
	 */
	support(direction) {
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