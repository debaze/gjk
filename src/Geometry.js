import {Vector3} from "./math/index.js";

export class Geometry {
	#vertices;
	#centerOfMass;

	/**
	 * @param {Vector3[]} vertices
	 */
	constructor(vertices) {
		if (vertices.length < 3) {
			throw new Error("Too few vertices provided.");
		}

		this.#vertices = vertices;
		this.#centerOfMass = new Vector3(0, 0, 0);

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
	 * @param {import("./math/index").Vector2} C Center
	 * @param {import("./math/index").Vector2} O Origin
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