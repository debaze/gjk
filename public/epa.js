import {Vector3} from "../src/math/Vector3.js";
import {Shape} from "../src/Shape/index.js";
import {closestEdge} from "./closestEdge.js";
import {support} from "./support.js";

const EPA_THRESHOLD = 0.0001;

/**
 * @param {Shape} shape1
 * @param {Shape} shape2
 * @param {Vector3[]} simplex
 */
export function epa(shape1, shape2, simplex) {
	const polytope = simplex;

	while (true) {
		const edge = closestEdge(polytope);
		const s = support(shape1, shape2, edge.normal);

		if (Math.abs(edge.normal.dot(s) - edge.distance) < EPA_THRESHOLD) {
			return {
				start: edge.start,
				end: edge.end,
				normal: edge.normal,
				distance: edge.distance,
			};
		}

		polytope.splice(edge.startIndex + 1, 0, s);
	}
}