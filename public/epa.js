import {PolygonWinding} from "../src/index.js";
import {Vector3} from "../src/math/Vector3.js";
import {Mesh} from "../src/Mesh/index.js";
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
 * @param {Mesh} mesh1
 * @param {Mesh} mesh2
 * @param {import("./types.js").Simplex} simplex
 */
export function epa(mesh1, mesh2, simplex) {
	for (let i = 0; i < MAX_ITERATIONS; i++) {
		const e = closestEdge(simplex, PolygonWinding.CLOCKWISE);
		const s = support(mesh1, mesh2, e.normal);

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