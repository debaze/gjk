import {PolygonWinding} from "../src/index.js";
import {Geometry} from "../src/Geometry/index.js";
import {Vector3} from "../src/math/Vector3.js";
import {closestEdge} from "./closestEdge.js";
import {support} from "./support.js";

/**
 * @typedef {Object} Collision
 * @property {Vector3} normal
 * @property {Number} depth
 */

/**
 * Max number tested: 7
 */
const MAX_ITERATIONS = 16;
const EPA_THRESHOLD = 0.0001;

/**
 * @param {Geometry} g1
 * @param {Geometry} g2
 * @param {import("./types.js").Simplex} simplex
 */
export function epa(g1, g2, simplex) {
	for (let i = 0; i < MAX_ITERATIONS; i++) {
		const e = closestEdge(simplex, PolygonWinding.CLOCKWISE);
		const s = support(g1, g2, e.normal);

		if (s.dot(e.normal) - e.distance < EPA_THRESHOLD) {
			/**
			 * @type {Collision}
			 */
			const collision = {
				normal: e.normal,
				depth: e.distance,
			};

			return collision;
		}

		simplex.splice(e.endIndex, 0, s);
	}

	return null;
}