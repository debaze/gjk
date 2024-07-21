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
	 * @param {PolygonGeometryDescriptor} descriptor
	 */
	constructor(descriptor) {
		super();

		if (descriptor.vertices.length < 3) {
			throw new Error("Too few vertices provided");
		}

		this.#vertices = descriptor.vertices;

		const centerOfMass = new Vector3(0, 0, 0);

		for (let i = 0; i < this.#vertices.length; i++) {
			const vertex = this.#vertices[i];

			centerOfMass.add(vertex);
		}

		centerOfMass.divideScalar(this.#vertices.length);

		super._setCenterOfMass(centerOfMass);
	}

	/**
	 * @param {Vector3} D Direction
	 */
	support(D) {
		let pId = 0;
		let pDot = this.#vertices[0].dot(D);
		let n = 2;
		let order = 1;

		const p1Dot = this.#vertices[1].dot(D);

		if (p1Dot > pDot) {
			pId = 1;
			pDot = p1Dot;
		} else {
			n = this.#vertices.length - 1;
			order = -1;
		}

		for (let testCount = 2; testCount < this.#vertices.length; n += order, testCount++) {
			const pNDot = this.#vertices[n].dot(D);

			if (pNDot <= pDot) {
				break;
			}

			pId = n;
			pDot = pNDot;
		}

		return this.#vertices[pId];
	}

	/**
	 * @param {CanvasRenderingContext2D} context
	 * @param {Vector2} C Center
	 * @param {Vector2} O Origin
	 */
	render(context, C, O) {
		context.beginPath();

		const v0 = new Vector3(
			C[0] + this.#vertices[0][0] + O[0],
			O[1] - (C[1] + this.#vertices[0][1]),
			C[2] + O[2],
		);
		context.moveTo(v0[0], v0[1]);

		for (let n = 1; n < this.#vertices.length; n++) {
			const vN = new Vector3(
				C[0] + this.#vertices[n][0] + O[0],
				O[1] - (C[1] + this.#vertices[n][1]),
				C[2] + O[2],
			);

			context.lineTo(vN[0], vN[1]);
		}

		context.lineTo(v0[0], v0[1]);
	}
}