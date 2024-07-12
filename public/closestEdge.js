import {PolygonWinding} from "../src/index.js";
import {Vector3} from "../src/math/index.js";

/**
 * @typedef {Object} ClosestEdge
 * @property {Vector3} normal
 * @property {Number} distance
 * @property {Number} endIndex
 */

/**
 * @param {Vector3[]} polytope The simplex returned from the GJK response
 * @param {PolygonWinding} winding
 */
export function closestEdge(polytope, winding) {
	const l = polytope.length;

	/**
	 * @type {ClosestEdge}
	 */
	const closestEdge = {};

	closestEdge.distance = Number.POSITIVE_INFINITY;

	for (let i = 0; i < l; i++) {
		const j = (i + 1) % l;
		const a = polytope[i];
		const b = polytope[j];
		const e = new Vector3(b).subtract(a);
		const n = new Vector3();

		switch (winding) {
			case PolygonWinding.CLOCKWISE:
				n.set(new Vector3(e[1], -e[0], e[2]));

				break;
			case PolygonWinding.COUNTER_CLOCKWISE:
				n.set(new Vector3(-e[1], e[0], e[2]));

				break;
		}

		n.normalize();

		// Could use a or b here
		const distance = n.dot(a);

		if (distance < closestEdge.distance) {
			closestEdge.normal = n;
			closestEdge.distance = distance;
			closestEdge.endIndex = j;
		}
	}

	return closestEdge;
}