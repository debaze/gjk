import {PolygonWinding} from "../src/index.js";
import {closestEdge} from "./closestEdge.js";
import {support} from "./support.js";

/**
 * @typedef {Object} Collision
 * @property {import("../src/math/index").Vector3} normal
 * @property {Number} depth
 * @property {import("../src/math/index").Vector3[]} polytope
 */

/**
 * Max number tested: 7
 */
const EPA_MAX_ITERATIONS = 16;
const EPA_THRESHOLD = .001;

/**
 * @param {import("../src/index.js").Object} object1
 * @param {import("../src/index.js").Object} object2
 * @param {import("./types.js").Simplex} simplex
 */
export function ExpandingPolytopeAlgorithm(object1, object2, simplex) {
	const polytope = Array.from(simplex);

	for (let i = 0; i < EPA_MAX_ITERATIONS; i++) {
		const e = closestEdge(polytope, PolygonWinding.CLOCKWISE);
		const s = support(object1, object2, e.normal);

		if (s.dot(e.normal) - e.distance < EPA_THRESHOLD) {
			/**
			 * @type {Collision}
			 */
			const collision = {
				normal: e.normal,
				depth: e.distance,
				polytope,
			};

			return collision;
		}

		polytope.splice(e.index, 0, s);
	}

	return null;
}