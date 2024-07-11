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

		if (vertices.length < 3) {
			throw new Error("Too few vertices provided");
		}

		this.#vertices = vertices;
	}

	getVertices() {
		return this.#vertices;
	}

	/**
	 * @param {Vector3} direction
	 */
	support(direction) {
		let pId = 0;
		let pDot = this.#getClipSpaceVertex(0).dot(direction);
		let n = 2;
		let order = 1;

		const p1Dot = this.#getClipSpaceVertex(1).dot(direction);

		if (p1Dot > pDot) {
			pId = 1;
			pDot = p1Dot;
		} else {
			n = this.#vertices.length - 1;
			order = -1;
		}

		for (let testCount = 2; testCount < this.#vertices.length; n += order, testCount++) {
			const pNDot = this.#getClipSpaceVertex(n).dot(direction);

			if (pNDot <= pDot) {
				break;
			}

			pId = n;
			pDot = pNDot;
		}

		return this.#getClipSpaceVertex(pId);
	}

	/**
	 * @param {CanvasRenderingContext2D} ctx
	 * @param {Vector3} center
	 */
	render(ctx, center) {
		ctx.strokeStyle = this.getColor();
		ctx.beginPath();

		const v0 = new Vector3(
			this.getPosition()[0] + this.#vertices[0][0] + center[0],
			center[1] - (this.getPosition()[1] + this.#vertices[0][1]),
			this.getPosition()[2] + center[2],
		);
		ctx.moveTo(v0[0], v0[1]);

		for (let n = 1; n < this.#vertices.length; n++) {
			const vN = new Vector3(
				this.getPosition()[0] + this.#vertices[n][0] + center[0],
				center[1] - (this.getPosition()[1] + this.#vertices[n][1]),
				this.getPosition()[2] + center[2],
			);

			ctx.lineTo(vN[0], vN[1]);
		}

		ctx.lineTo(v0[0], v0[1]);
	}

	/**
	 * @param {Number} index
	 * @throws {Exception} if the index overflows the vertex buffer
	 */
	#getClipSpaceVertex(index) {
		if (index >= this.#vertices.length) {
			throw new Error("Index overflow in vertex buffer");
		}

		return new Vector3(this.getPosition())
			.add(this.#vertices[index]);
	}
}