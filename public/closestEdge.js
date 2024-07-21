import {PolygonWinding} from "../src/index.js";
import {Vector3} from "../src/math/index.js";

/**
 * @typedef {Object} ClosestEdge
 * @property {Vector3} normal
 * @property {Number} distance
 * @property {Number} index
 */

/**
 * @param {Vector3[]} polytope
 * @param {PolygonWinding} winding
 */
export function closestEdge(polytope, winding) {
	/**
	 * @type {ClosestEdge}
	 */
	const closestEdge = {};

	closestEdge.distance = Number.POSITIVE_INFINITY;

	for (let i = 0; i < polytope.length; i++) {
		const j = (i + 1) % polytope.length;
		const a = polytope[i];
		const b = polytope[j];
		const e = new Vector3(b).subtract(a);
		const n = new Vector3();
		const isClockwise = winding === PolygonWinding.CLOCKWISE ? 1 : -1;

		n[0] = e[1] * isClockwise;
		n[1] = e[0] * -isClockwise;
		n[2] = e[2];
		n.normalize();

		// Could use a or b here
		const d = n.dot(a);

		if (d < closestEdge.distance) {
			// d is now the closest distance

			closestEdge.normal = n;
			closestEdge.distance = d;
			closestEdge.index = j;
		}
	}

	return closestEdge;
}