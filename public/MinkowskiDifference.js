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
	 * @param {import("../src/index.js").Object} M1
	 * @param {import("../src/index.js").Object} M2
	 * @param {import("../src/math/index.js").Vector2} d Direction, not necessarily normalized
	 */
	static support(M1, M2, d) {
		/**
		 * @type {import("./GJK.js").SimplexVertex}
		 */
		const vertex = {};

		vertex.index1 = M1.supportBase(this.#mulT(this.#rotation(M1), negate(d)));
		vertex.vertex1 = new Vector2(M1.geometry.vertices[vertex.index1]).multiplyMatrix(M1.transform);
		vertex.index2 = M2.supportBase(this.#mulT(this.#rotation(M2), d));
		vertex.vertex2 = new Vector2(M2.geometry.vertices[vertex.index2]).multiplyMatrix(M2.transform);
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

	/**
	 * @param {import("../src/index.js").Object} M
	 */
	static #rotation(M) {
		return Matrix3.rotation(-M.rotation);
	}
}