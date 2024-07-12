import {Vector3} from "../src/math/index.js";

/**
 * @typedef {Object} ClosestEdge
 * @property {Vector3} start
 * @property {Number} startIndex
 * @property {Vector3} end
 * @property {Vector3} normal
 * @property {Number} distance
 */

/**
 * @param {Vector3[]} polytope The simplex returned from the GJK response
 */
export function closestEdge(polytope) {
	const edge = new Vector3();
	const normal = new Vector3();
	let minDistance = Number.NEGATIVE_INFINITY;

	/**
	 * @type {ClosestEdge}
	 */
	let closestEdge = {};

	for (let i = 0; i < polytope.length; i++) {
		const start = polytope[i];
		const end = polytope[(i + 1) % polytope.length];

		edge.set(end);
		edge.subtract(start);

		normal.set(edge.cross(start).cross(edge));

		const distance = normal.dot(start);

		if (distance < minDistance) {
			minDistance = distance;
			closestEdge.start = start;
			closestEdge.startIndex = i;
			closestEdge.end = end;
			closestEdge.distance = distance;
			closestEdge.normal = normal;
		}
	}

	return closestEdge;
}