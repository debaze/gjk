import {negate, Vector2} from "../src/math/index.js";

/**
 * @typedef {Object} Support
 * @property {Number} index
 * @property {import("../src/math/index.js").Vector2} vertex (Already transformed)
 */

export class MinkowskiDifference {
	/**
	 * @param {import("../src/index.js").Object} M1
	 * @param {import("../src/index.js").Object} M2
	 * @param {import("../src/math/index.js").Vector2} D Direction, not necessarily normalized
	 */
	static support(M1, M2, D) {
		/**
		 * @type {import("./gjk.js").SimplexVertex}
		 */
		const simplexVertex = {};

		const s1 = M1.support(D);
		const s2 = M2.support(negate(D));

		simplexVertex.vertex = new Vector2(s1.vertex).subtract(s2.vertex);
		simplexVertex.vertex1 = s1.vertex;
		simplexVertex.vertex2 = s2.vertex;
		simplexVertex.index1 = s1.index;
		simplexVertex.index2 = s2.index;
		simplexVertex.u = 1;

		return simplexVertex;
	}
}