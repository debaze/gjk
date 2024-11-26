import {dot, Vector2} from "../src/math/index.js";

export class MînkowskiDifference {
	/**
	 * @param {import("../src/index.js").Object} M1
	 * @param {import("../src/index.js").Object} M2
	 * @param {import("../src/math/index.js").Vector2} D Direction, not necessarily normalized
	 */
	static support(M1, M2, D) {
		/**
		 * @type {import("./GJK.js").SimplexVertex}
		 */
		const simplexVertex = {};

		const s1 = support(M1, D);
		const s2 = support(M2, new Vector2(D).negate());

		simplexVertex.vertex = new Vector2(s1.vertex).subtract(s2.vertex);
		simplexVertex.vertex1 = s1.vertex;
		simplexVertex.vertex2 = s2.vertex;
		simplexVertex.index1 = s1.index;
		simplexVertex.index2 = s2.index;
		simplexVertex.u = 1;

		return simplexVertex;
	}
}

/**
 * @todo Matrix multiplication costly with too many vertices
 * 
 * @param {import("../src/index.js").Object} polygon
 * @param {import("../src/math/index.js").Vector2} D Direction
 */
function support(polygon, D) {
	/**
	 * @type {import("./GJK.js").Support}
	 */
	const response = {};

	const vertices = polygon.getGeometry().getVertices();

	response.index = 0;
	response.vertex = new Vector2(vertices[response.index]).multiplyMatrix(polygon.transform);

	let maxAngle = dot(response.vertex, D);

	for (let i = response.index + 1; i < vertices.length; i++) {
		const vertex = new Vector2(vertices[i]).multiplyMatrix(polygon.transform);
		const angle = dot(vertex, D);

		if (angle > maxAngle) {
			response.index = i;
			response.vertex = vertex;

			maxAngle = angle;
		}
	}

	return response;
}