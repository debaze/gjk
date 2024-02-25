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
	 * @type {String}
	 */
	#color;

	/**
	 * @param {Vector2} position
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
	 * @param {Vector2} position
	 */
	setPosition(position) {
		this.#position = position;
	}

	getColor() {
		return this.#color;
	}

	/**
	 * @abstract
	 * @param {Vector2} direction
	 * @returns {Vector2}
	 */
	getSupportPoint(direction) {
		throw new Error("Not implemented");
	}

	/**
	 * @abstract
	 * @param {CanvasRenderingContext2D} ctx
	 */
	render(ctx) {
		throw new Error("Not implemented");
	}
}