import {closestEdge} from "./closestEdge.js";
import {MinkowskiDifference} from "../MinkowskiDifference.js";
import {PolygonWinding} from "../../src/index.js";

/**
 * @typedef {Object} Collision
 * @property {import("../../src/math/index").Vector2} normal
 * @property {Number} depth
 * @property {import("../../src/math/index").Vector2[]} polytope
 */

/**
 * Max number tested: 7
 */
const EPA_MAX_ITERATIONS = 16;
const EPA_THRESHOLD = .001;

/**
 * @param {import("../../src/index.js").Object} object1
 * @param {import("../../src/index.js").Object} object2
 * @param {import("../../src/math/index.js").Vector2[]} simplex
 */
export function ExpandingPolytopeAlgorithm(object1, object2, simplex) {
	const polytope = Array.from(simplex);

	for (let i = 0; i < EPA_MAX_ITERATIONS; i++) {
		const e = closestEdge(polytope, PolygonWinding.CLOCKWISE);
		const s = MinkowskiDifference.support(object1, object2, e.normal);

		if (s.vertex.dot(e.normal) - e.distance < EPA_THRESHOLD) {
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

		polytope.splice(e.index, 0, s.vertex);
	}

	return null;
}