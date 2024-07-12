import {Vector3} from "../src/math/Vector3.js";
import {PolygonWinding} from "../src/PolygonWinding.js";
import {Shape} from "../src/Shape/index.js";
import {closestEdge} from "./closestEdge.js";
import {support} from "./support.js";

/**
 * @typedef {Object} Collision
 * @property {Vector3} normal
 * @property {Number} depth
 */

const MAX_ITERATIONS = 64;
const EPA_THRESHOLD = 0.0001;

let k = 1;

/**
 * @param {Shape} shape1
 * @param {Shape} shape2
 * @param {Vector3[]} simplex
 */
export function epa(shape1, shape2, simplex) {
	for (let i = 0; i < MAX_ITERATIONS; i++) {
		const e = closestEdge(simplex, PolygonWinding.CLOCKWISE);
		const s = support(shape1, shape2, e.normal);

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