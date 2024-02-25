import {Vector2} from "../math/index.js";
import {Shape} from "./Shape.js";

export class Polygon extends Shape {
	/**
	 * @type {Vector2[]}
	 */
	#vertices;

	/**
	 * @param {Vector2} position
	 * @param {Vector2[]} vertices
	 * @param {String} color
	 */
	constructor(position, vertices, color) {
		super(position, color);

		if (!vertices.length) {
			throw new Error("No vertices provided");
		}

		this.#vertices = vertices;
	}

	getVertices() {
		return this.#vertices;
	}

	/**
	 * @param {Vector2} direction
	 * @returns {Vector2}
	 */
	getSupportPoint(direction) {
		const dotProducts = [];

		for (let i = 0; i < this.#vertices.length; i++) {
			const dotProduct = this.#vertices[i].dot(direction);

			dotProducts.push(dotProduct);
		}

		const maxDotProductIndex = dotProducts.indexOf(Math.max(...dotProducts));

		return this.#vertices[maxDotProductIndex];
	}

	/**
	 * @param {CanvasRenderingContext2D} ctx
	 */
	render(ctx) {
		const position = this.getPosition();

		ctx.save();
			ctx.strokeStyle = this.getColor();
			ctx.beginPath();
			ctx.moveTo(position[0] + this.#vertices[0][0], position[1] + this.#vertices[0][1]);

			for (let i = 1; i < this.#vertices.length; i++) {
				ctx.lineTo(position[0] + this.#vertices[i][0], position[1] + this.#vertices[i][1]);
			}

			ctx.stroke();
		ctx.restore();
	}
}