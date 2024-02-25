import {PI, Vector2} from "../math/index.js";
import {Shape} from "./Shape.js";

export class Circle extends Shape {
	/**
	 * @type {Number}
	 */
	#radius;

	/**
	 * @param {Vector2} position
	 * @param {Number} radius
	 */
	constructor(position, radius) {
		super(position);

		this.#radius = radius;
	}

	/**
	 * @param {CanvasRenderingContext2D} ctx
	 */
	render(ctx) {
		const position = this.getPosition();

		ctx.beginPath();
		ctx.arc(position[0], position[1], this.#radius, 0, PI * 2);
		ctx.stroke();
	}
}