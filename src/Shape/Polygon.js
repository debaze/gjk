import {Vector3} from "../math/index.js";
import {Shape} from "./Shape.js";

export class Polygon extends Shape {
	/**
	 * @type {Vector3[]}
	 */
	#vertices;

	/**
	 * @param {Vector3} position
	 * @param {Vector3[]} vertices
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
	 * @param {Vector3} direction
	 */
	getFarthestSupportPoint(direction) {
		let pId = 0;
		let pDot = -Infinity;

		for (let i = 0; i < this.#vertices.length; i++) {
			const dotProduct = new Vector3(
				this.getPosition()[0] + this.#vertices[i][0],
				this.getPosition()[1] - this.#vertices[i][1],
				this.getPosition()[2] + this.#vertices[i][2],
			).dot(direction);

			if (dotProduct > pDot) {
				pId = i;
				pDot = dotProduct;
			}
		}

		return new Vector3(
			this.getPosition()[0] + this.#vertices[pId][0],
			this.getPosition()[1] - this.#vertices[pId][1],
			this.getPosition()[2] + this.#vertices[pId][2],
		);
	}

	/**
	 * @param {CanvasRenderingContext2D} ctx
	 * @param {Vector3} center
	 */
	render(ctx, center) {
		const position = new Vector3(center).add(this.getPosition());

		ctx.strokeStyle = this.getColor();
		ctx.beginPath();
		ctx.moveTo(position[0] + this.#vertices[0][0], position[1] - this.#vertices[0][1]);

		for (let i = 1; i < this.#vertices.length; i++) {
			ctx.lineTo(position[0] + this.#vertices[i][0], position[1] - this.#vertices[i][1]);
		}

		ctx.lineTo(position[0] + this.#vertices[0][0], position[1] - this.#vertices[0][1]);
	}
}