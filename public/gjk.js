import {MînkowskiDifference} from "./MinkowskiDifference.js";
import {cross, length, Vector2} from "../src/math/index.js";

/**
 * @typedef {Object} ClosestPointResponse
 * @property {import("../src/math/index.js").Vector2[]} geometry Input geometry (visualization purposes)
 * @property {import("../src/math/index.js").Vector2} input Query point
 * @property {import("../src/math/index.js").Vector2} closest Closest point on the shape
 * @property {Number} distance Distance between the closest point the and query point
 * @property {import("../src/math/index.js").Vector2[]} [simplex] Visualization purposes
 * @property {Number[]} uncontributingVertexIndices Indices of the vertices on the input simplex that do not contribute to the response
 */

/**
 * @typedef {Object} ClosestPointPolygonPolygonResponse
 * @property {import("../src/index.js").Object} object1
 * @property {import("../src/index.js").Object} object2
 * @property {import("../src/math/index.js").Vector2} closest1 Closest point on the shape 1
 * @property {import("../src/math/index.js").Vector2} closest2 Closest point on the shape 2
 * @property {SimplexVertex[]} [simplex] Visualization purposes
 */

/**
 * @typedef {Object} Support
 * @property {Number} index
 * @property {import("../src/math/index.js").Vector2} vertex (Already transformed)
 */

/**
 * @typedef {Object} SimplexVertex
 * @property {import("../src/math/index.js").Vector2} vertex vertex1 - vertex2
 * @property {import("../src/math/index.js").Vector2} vertex1 Transformed support point on shape 1
 * @property {import("../src/math/index.js").Vector2} vertex2 Transformed support point on shape 2
 * @property {Number} index1 Index on shape 1
 * @property {Number} index2 Index on shape 2
 * @property {Number} u Closest point barycentric coordinate
 */

/**
 * @typedef {SimplexVertex[]} Simplex
 */

const POLYGON_POLYGON_MAX_ITERATIONS = 8;

// Max recorded = 4
let maxRecordedIterations = 0;

/**
 * @param {import("../src/index.js").Object} M1
 * @param {import("../src/index.js").Object} M2
 */
export function ClosestPointPolygonPolygon(M1, M2) {
	/**
	 * @type {ClosestPointPolygonPolygonResponse}
	 */
	const response = {};

	// 1. Pick arbitrary initial simplex S on T.
	const D = new Vector2(M2.getGeometry().getCenterOfMass()).subtract(M1.getGeometry().getCenterOfMass());
	const a = MînkowskiDifference.support(M1, M2, D);

	const S = [a];

	response.object1 = M1;
	response.object2 = M2;
	response.simplex = S;

	let i = 0;

	loop: for (; i <= POLYGON_POLYGON_MAX_ITERATIONS; i++) {
		// Copy simplex for duplicate searching
		const SCopy = [...S];

		// 2.a. Compute the closest point P on S.
		closestPoint(S);

		// Termination case 2: containment
		// If we have 3 points, then the origin is in the corresponding triangle.
		if (S.length === 3) {
			break;
		}

		// 2.c. Calculate direction vector D pointing from P to Q.
		D.set(getSearchDirection(S));

		// Termination case 3a: vertex overlap
		// Ensure the search direction non-zero.
		if (D.x === 0 && D.y === 0) {
			console.warn("Vertex overlap: D = (0, 0).");

			break;
		}

		// 2.d. Compute the support point P2 in direction of D.
		const P2 = MînkowskiDifference.support(M1, M2, D);

		// Termination case 1: repeated support point
		// Check for duplicate support points. This is the main termination criteria.
		for (let i = 0; i < SCopy.length; i++) {
			// If we found a duplicate support point we must exit to avoid cycling.
			if (P2.index1 === SCopy[i].index1 && P2.index2 === SCopy[i].index2) {
				break loop;
			}
		}

		// 2.e. Add P2 to S.
		S.push(P2);
	}

	getClosestPointsOnPolygons(response, S);
	// response.closest1 = closestPoint;

	if (i > maxRecordedIterations) {
		maxRecordedIterations = i;

		console.warn("(Polygon-Polygon) Max recorded iteration count:", maxRecordedIterations);
	}

	return response;
}

/**
 * 1. Compute edge barycentric coordinates uAB, vAB, uBC, vBC, uCA, vCA.
 * 2. Test vertex regions.
 * 3. If not in a vertex region, compute triangle barycentric coordinates uABC, vABC, wABC.
 * 4. Test edge regions.
 * 5. If not in an edge region, return interior region.
 * 
 * @param {Simplex} simplex
 */
export function ClosestPointTriangle(simplex) {
	const A = simplex[0];
	const B = simplex[1];
	const C = simplex[2];
	const Q = new Vector2(0, 0);

	let uAB, vAB;
	let uBC, vBC;
	let uCA, vCA;

	// Calculate AB barycentric coordinates.
	{
		const ABnorm = new Vector2(B.vertex).subtract(A.vertex);
		const ABlen = length(ABnorm);

		ABnorm.normalize();

		vAB = B.vertex.dot(ABnorm) / ABlen;
		uAB = 1 - vAB;
	}

	// Calculate BC barycentric coordinates.
	{
		const BCnorm = new Vector2(C.vertex).subtract(B.vertex);
		const BClen = length(BCnorm);

		BCnorm.normalize();

		vBC = C.vertex.dot(BCnorm) / BClen;
		uBC = 1 - vBC;
	}

	// Calculate CA barycentric coordinates.
	{
		const CAnorm = new Vector2(A.vertex).subtract(C.vertex);
		const CAlen = length(CAnorm);

		CAnorm.normalize();

		vCA = A.vertex.dot(CAnorm) / CAlen;
		uCA = 1 - vCA;
	}

	// Test region A.
	if (uCA > 1 && uAB <= 0) {
		A.u = 1;
		simplex[0] = A;
		simplex.length = 1;

		return;
	}

	// Test region B.
	if (uAB > 1 && uBC <= 0) {
		B.u = 1;
		simplex[0] = B;
		simplex.length = 1;

		return;
	}

	// Test region C.
	if (uBC > 1 && uCA <= 0) {
		C.u = 1;
		simplex[0] = C;
		simplex.length = 1;

		return;
	}

	let uABC, vABC, wABC;

	// Calculate ABC barycentric coordinates.
	{
		const abc = area(A.vertex, B.vertex, C.vertex);

		uABC = area(Q,        B.vertex, C.vertex) / abc;
		vABC = area(A.vertex, Q,        C.vertex) / abc;
		wABC = area(A.vertex, B.vertex, Q       ) / abc;
	}

	// Test region AB.
	if (uAB >= 0 && vAB >= 0 && wABC <= 0) {
		A.u = vAB;
		B.u = uAB;
		simplex[0] = A;
		simplex[1] = B;
		simplex.length = 2;

		return;
	}

	// Test region BC.
	if (uBC >= 0 && vBC >= 0 && uABC <= 0) {
		B.u = vBC;
		C.u = uBC;
		simplex[0] = B;
		simplex[1] = C;
		simplex.length = 2;

		return;
	}

	// Test region CA.
	if (uCA >= 0 && vCA >= 0 && vABC <= 0) {
		C.u = vCA;
		A.u = uCA;
		simplex[0] = C;
		simplex[1] = A;
		simplex.length = 2;

		return;
	}

	simplex[0].u = uABC;
	simplex[1].u = vABC;
	simplex[2].u = wABC;
}

/**
 * @param {Simplex} simplex
 */
export function ClosestPointLine(simplex) {
	const a = simplex[0];
	const b = simplex[1];
	const ab = new Vector2(b.vertex).subtract(a.vertex);
	const length = ab.magnitude();
	const normal = ab.normalize();

	const v = b.vertex.dot(normal) / length;
	const u = 1 - v;

	if (u < 0) {
		a.u = 1;

		simplex[0] = a;
		simplex.length = 1;

		return;
	}

	if (v < 0) {
		b.u = 1;

		simplex[0] = b;
		simplex.length = 1;

		return;
	}

	simplex[0].u = 1 - u;
	simplex[1].u = 1 - v;
}

/**
 * @param {import("../src/math/index.js").Vector2} a
 * @param {import("../src/math/index.js").Vector2} b
 * @param {import("../src/math/index.js").Vector2} c
 */
function area(a, b, c) {
	const ab = new Vector2(b).subtract(a);
	const ac = new Vector2(c).subtract(a);

	return 0.5 * cross(ab, ac);
}

/**
 * @param {Simplex} simplex
 */
function closestPoint(simplex) {
	switch (simplex.length) {
		case 1:
			return;
		case 2:
			ClosestPointLine(simplex);

			return;
		case 3:
			ClosestPointTriangle(simplex);

			return;
		default:
			throw new Error("Invalid simplex.");
	}
}

/**
 * @param {SimplexVertex[]} simplex
 */
function getSearchDirection(simplex) {
	switch (simplex.length) {
		case 1:
			return new Vector2(simplex[0].vertex).negate();
		case 2: {
			const ab = new Vector2(simplex[1].vertex).subtract(simplex[0].vertex);
			const sign = cross(ab, new Vector2(simplex[0].vertex).negate());

			if (sign > 0) {
				return new Vector2(-ab.y, ab.x);
			}

			return new Vector2(ab.y, -ab.x);
		}
		default:
			throw new Error("Invalid simplex.");
	}
}

/**
 * @param {ClosestPointPolygonPolygonResponse} response
 * @param {Simplex} simplex
 */
function getClosestPointsOnPolygons(response, simplex) {
	switch (simplex.length) {
		case 1:
			response.closest1 = simplex[0].vertex1;
			response.closest2 = simplex[0].vertex2;

			break;
		case 2:
			response.closest1 = new Vector2(simplex[0].vertex1).multiplyScalar(simplex[0].u).add(new Vector2(simplex[1].vertex1).multiplyScalar(simplex[1].u));
			response.closest2 = new Vector2(simplex[0].vertex2).multiplyScalar(simplex[0].u).add(new Vector2(simplex[1].vertex2).multiplyScalar(simplex[1].u));

			break;
		case 3:
			/**
			 * @todo Compute closest points on intersection?
			 */
			/* response.closest1 = new Vector2(simplex[0].vertex1).multiplyScalar(simplex[0].u)
				.add(new Vector2(simplex[1].vertex1).multiplyScalar(simplex[1].u))
				.add(new Vector2(simplex[2].vertex1).multiplyScalar(simplex[2].u));
			response.closest2 = response.closest1; */

			break;
	}
}