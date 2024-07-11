import {PI, Vector3} from "../math/index.js";
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
	 * @param {CanvasRenderingContext2D} ctx
	 * @param {Vector3} center
	 */
	render(ctx, center) {
		const position = new Vector3(center).add(this.getPosition());

		ctx.strokeStyle = this.getColor();
		ctx.beginPath();
		ctx.arc(position[0], position[1], this.#radius, 0, PI * 2);
	}
}