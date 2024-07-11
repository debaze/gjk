import {PI, Vector2, Vector3} from "../math/index.js";
import {Shape} from "./Shape.js";

export class Circle extends Shape {
	/**
	 * @type {Number}
	 */
	#radius;

	/**
	 * @param {Vector3} position
	 * @param {Number} radius
	 * @param {String} color
	 */
	constructor(position, radius, color) {
		super(position, color);

		this.#radius = radius;
	}

	/**
	 * @param {Vector3} direction
	 */
	support(direction) {
		return new Vector3(direction)
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