import {PolygonWinding} from "../src/index.js";
import {Vector3} from "../src/math/index.js";
import {Mesh} from "../src/Mesh/index.js";
import {closestEdge} from "./closestEdge.js";
import {support} from "./support.js";

/**
 * @typedef {Object} Collision
 * @property {Vector3} normal
 * @property {Number} depth
 * @property {Vector3[]} polytope
 */

/**
 * Max number tested: 7
 */
const EPA_MAX_ITERATIONS = 16;
const EPA_THRESHOLD = .001;

/**
 * Expanding Polytope Algorithm
 * 
 * @param {Mesh} mesh1
 * @param {Mesh} mesh2
 * @param {import("./types.js").Simplex} simplex
 */
export function epa(mesh1, mesh2, simplex) {
	const polytope = Array.from(simplex);

	for (let i = 0; i < EPA_MAX_ITERATIONS; i++) {
		const e = closestEdge(polytope, PolygonWinding.CLOCKWISE);
		const s = support(mesh1, mesh2, e.normal);

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