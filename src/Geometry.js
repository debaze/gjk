import {dot, Vector2} from "./math/index.js";

export class Geometry {
	#vertices;

	#centerOfMass = new Vector2(0, 0);

	/**
	 * @param {import("./math/index.js").Vector2[]} vertices
	 */
	constructor(vertices) {
		/* if (vertices.length < 3) {
			throw new Error("Too few vertices provided.");
		} */

		this.#vertices = vertices;

		for (let i = 0; i < this.#vertices.length; i++) {
			const vertex = this.#vertices[i];

			this.#centerOfMass.add(vertex);
		}

		this.#centerOfMass.divideScalar(this.#vertices.length);
	}

	getVertices() {
		return this.#vertices;
	}

	getCenterOfMass() {
		return this.#centerOfMass;
	}

	/**
	 * @param {import("./math/index.js").Vector2} D Direction
	 */
	support(D) {
		let pId = 0;
		let pDot = dot(this.#vertices[0], D);
		let n = 2;
		let order = 1;

		const p1Dot = dot(this.#vertices[1], D);

		if (p1Dot > pDot) {
			pId = 1;
			pDot = p1Dot;
		} else {
			n = this.#vertices.length - 1;
			order = -1;
		}

		for (let testCount = 2; testCount < this.#vertices.length; n += order, testCount++) {
			const pNDot = dot(this.#vertices[n], D);

			if (pNDot <= pDot) {
				break;
			}

			pId = n;
			pDot = pNDot;
		}

		return this.#vertices[pId];
	}
}