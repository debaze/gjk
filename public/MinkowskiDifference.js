import {dot, Matrix3, negate, transpose, Vector2} from "../src/math/index.js";

/**
 * @typedef {Object} Support
 * @property {Number} index
 * @property {import("../src/math/index.js").Vector2} vertex (Already transformed)
 */

/**
 * @typedef {Object} SupportTime
 * @property {Number} index
 * @property {Number} t
 * @property {import("../src/math/index.js").Vector2} vertex No transform applied
 * @property {import("../src/math/index.js").Vector2} transformedVertex T transform applied
 * @property {Number} angle
 */

export class MinkowskiDifference {
	/**
	 * @param {import("../src/index.js").Object} A
	 * @param {import("../src/index.js").Object} B
	 * @param {import("../src/math/index.js").Matrix3} transformA
	 * @param {import("../src/math/index.js").Matrix3} transformB
	 * @param {import("../src/math/index.js").Vector2} d Direction, not necessarily normalized
	 */
	static support(A, B, transformA, transformB, d) {
		/**
		 * @type {import("./GJK.js").SimplexVertex}
		 */
		const vertex = {};

		const rotationA = Matrix3.rotation(-A.rotation);
		const rotationB = Matrix3.rotation(-B.rotation);

		vertex.index1 = A.supportBase(this.#mulT(rotationA, negate(d)));
		vertex.vertex1 = new Vector2(A.geometry.vertices[vertex.index1]).multiplyMatrix(A.transform);
		vertex.index2 = B.supportBase(this.#mulT(rotationB, d));
		vertex.vertex2 = new Vector2(B.geometry.vertices[vertex.index2]).multiplyMatrix(B.transform);
		vertex.vertex = new Vector2(vertex.vertex2).subtract(vertex.vertex1);

		return vertex;
	}

	/**
	 * @param {import("../src/math/index.js").Matrix3} transform
	 * @param {import("../src/math/index.js").Vector2} vector
	 */
	static #mulT(transform, vector) {
		const col0 = new Vector2(transform[0], transform[3]);
		const col1 = new Vector2(transform[1], transform[4]);

		return new Vector2(dot(col0, vector), dot(col1, vector));
		// return new Vector2(vector).multiplyMatrix(transpose(transform));
	}
}