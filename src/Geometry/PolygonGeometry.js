import {Vector2, Vector3} from "../math/index.js";
import {Geometry} from "./Geometry.js";

/**
 * @typedef {Object} PolygonGeometryDescriptor
 * @property {Vector3[]} vertices
 */

export class PolygonGeometry extends Geometry {
	/**
	 * @type {Vector3[]}
	 */
	#vertices;

	/**
	 * @param {import("./Geometry.js").GeometryDescriptor & PolygonGeometryDescriptor} descriptor
	 */
	constructor(descriptor) {
		super(descriptor);

		if (descriptor.vertices.length < 3) {
			throw new Error("Too few vertices provided");
		}

		this.#vertices = descriptor.vertices;
	}

	getVertices() {
		return this.#vertices;
	}

	/**
	 * @param {Vector3} D
	 */
	support(D) {
		let pId = 0;
		let pDot = this.#getClipSpaceVertex(0).dot(D);
		let n = 2;
		let order = 1;

		const p1Dot = this.#getClipSpaceVertex(1).dot(D);

		if (p1Dot > pDot) {
			pId = 1;
			pDot = p1Dot;
		} else {
			n = this.#vertices.length - 1;
			order = -1;
		}

		for (let testCount = 2; testCount < this.#vertices.length; n += order, testCount++) {
			const pNDot = this.#getClipSpaceVertex(n).dot(D);

			if (pNDot <= pDot) {
				break;
			}

			pId = n;
			pDot = pNDot;
		}

		return this.#getClipSpaceVertex(pId);
	}

	/**
	 * @param {CanvasRenderingContext2D} context
	 * @param {Vector2} O
	 */
	render(context, O) {
		context.beginPath();

		const v0 = new Vector3(
			this.getPosition()[0] + this.#vertices[0][0] + O[0],
			O[1] - (this.getPosition()[1] + this.#vertices[0][1]),
			this.getPosition()[2] + O[2],
		);
		context.moveTo(v0[0], v0[1]);

		for (let n = 1; n < this.#vertices.length; n++) {
			const vN = new Vector3(
				this.getPosition()[0] + this.#vertices[n][0] + O[0],
				O[1] - (this.getPosition()[1] + this.#vertices[n][1]),
				this.getPosition()[2] + O[2],
			);

			context.lineTo(vN[0], vN[1]);
		}

		context.lineTo(v0[0], v0[1]);
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