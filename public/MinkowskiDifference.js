import {negate, Vector2} from "../src/math/index.js";

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
 */

export class MinkowskiDifference {
	/**
	 * @param {import("../src/index.js").Object} M1
	 * @param {import("../src/index.js").Object} M2
	 * @param {import("../src/math/index.js").Vector2} D Direction, not necessarily normalized
	 */
	static support(M1, M2, D) {
		/**
		 * @type {import("./GJK.js").SimplexVertex}
		 */
		const simplexVertex = {};

		const s1 = M1.support(negate(D));
		const s2 = M2.support(D);

		simplexVertex.vertex = new Vector2(s2.vertex).subtract(s1.vertex);
		simplexVertex.vertex1 = s1.vertex;
		simplexVertex.vertex2 = s2.vertex;
		simplexVertex.index1 = s1.index;
		simplexVertex.index2 = s2.index;
		simplexVertex.u = 1;

		return simplexVertex;
	}
}