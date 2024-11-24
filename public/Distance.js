import {cross, dot, length, Vector2} from "../src/math/index.js";

/**
 * @typedef {Object} ClosestPointResponse
 * @property {import("../src/math/index.js").Vector2[]} geometry Input geometry
 * @property {import("../src/math/index.js").Vector2} input Query point
 * @property {import("../src/math/index.js").Vector2} closest Closest point projected on the shape
 * @property {Number} distance Distance between the closest point the and query point
 * @property {import("../src/math/index.js").Vector2[]} [simplex] Visualization purposes
 * @property {Number[]} uncontributingVertexIndices Indices of the vertices on the input simplex that do not contribute to the response.
 */

/**
 * @typedef {Object} SupportResponse
 * @property {Number} index
 * @property {import("../src/math/index.js").Vector2} vertex Transformed vertex
 */

/**
 * @typedef {Object} RegionTestResponse
 * @property {import("../src/math/index.js").Vector2} closestVertex
 * @property {Number[]} uncontributingVertexIndices
 */

const MAX_ITERATIONS = 8;

// Max recorded = 3
let maxRecordedIterations = 0;

/**
 * Inputs: Polygon T, Query point Q
 * 
 * 1. Pick arbitrary initial simplex S on T.
 * 2. Loop:
 *        a. Compute the closest point P on S.
 *        b. Remove non-contributing vertices from S.
 *        c. Calculate direction vector D pointing from P to Q.
 *        d. Compute the support point P2 in direction of D.
 *        e. Add P2 to S.
 * 
 * @param {import("../src/index.js").Object} polygon
 * @param {import("../src/math/index.js").Vector2} input
 */
export function ClosestPointPolygon(polygon, input) {
	/**
	 * @type {ClosestPointResponse}
	 */
	const response = {};

	response.input = input;
	response.geometry = polygon.getGeometry().getVertices();

	const Q = input;

	// 1. Pick arbitrary initial simplex S on T.
	const D = new Vector2(1, 0);
	const a = support(polygon, D).vertex;

	const S = [a];

	response.simplex = S;
	response.uncontributingVertexIndices = [];

	let closestPoint;
	let closestDistance = Number.POSITIVE_INFINITY;
	let i = 0;

	for (; i <= MAX_ITERATIONS; i++) {
		// 2.a. Compute the closest point P on S.
		const P = getClosestPoint(S, Q);

		if (P.distance >= closestDistance) {
			// Distance should have decreased, not increased or stayed the same.
			// In this case the last vertex added to S could be not contributing, which can't be possible.
			break;
		}

		closestPoint = P.closest;
		closestDistance = P.distance;

		// Termination case 2: containment
		if (S.length === 3 && P.uncontributingVertexIndices.length === 0) {
			// Q is inside the simplex
			break;
		}

		// 2.b. Cull non-contributing vertices from S.
		// Uncontributing vertex indices MUST BE IN ASCENDING ORDER
		for (let i = P.uncontributingVertexIndices.length - 1; i >= 0; i--) {
			const index = P.uncontributingVertexIndices[i];

			S.splice(index, 1);
		}

		// 2.c. Calculate direction vector D pointing from P to Q.
		D.set(getSearchDirection(S, Q, P.closest));

		// Termination case 3a: vertex overlap
		if (D.x === 0 && D.y === 0) {
			console.warn("D is zero.");

			break;
		}

		// 2.d. Compute the support point P2 in direction of D.
		const P2 = support(polygon, D);

		// Termination case 1: repeated support point
		if (simplexContains(S, P2.vertex)) {
			break;
		}

		// 2.e. Add P2 to S.
		S.push(P2.vertex);
	}

	response.closest = closestPoint;
	response.distance = closestDistance;

	if (i > maxRecordedIterations) {
		maxRecordedIterations = i;

		console.warn("Max recorded iteration count:", maxRecordedIterations);
	}

	return response;
}

/**
 * Inputs: Triangle ABC, Input point Q
 * 
 * 1. Compute edge barycentric coordinates uAB, vAB, uBC, vBC, uCA, vCA.
 * 2. Test vertex regions. If found, return.
 * 3. Compute triangle barycentric coordinates uABC, vABC, wABC.
 * 4. Test edge regions. If found, return.
 * 5. Else, return interior region.
 * 
 * @param {import("../src/math/index.js").Vector2[]} simplex
 * @param {import("../src/math/index.js").Vector2} input
 */
export function ClosestPointTriangle(simplex, input) {
	/**
	 * @type {ClosestPointResponse}
	 */
	const response = {};

	response.input = input;

	const A = simplex[0];
	const B = simplex[1];
	const C = simplex[2];
	const Q = input;

	response.geometry = simplex;

	let uAB, vAB;
	let uBC, vBC;
	let uCA, vCA;

	// Calculate AB barycentric coordinates.
	{
		const ABnorm = new Vector2(B).subtract(A);
		const ABlen = length(ABnorm);

		ABnorm.normalize();

		uAB = new Vector2(Q).subtract(A).dot(ABnorm) / ABlen;
		vAB = new Vector2(B).subtract(Q).dot(ABnorm) / ABlen;
	}

	// Calculate BC barycentric coordinates.
	{
		const BCnorm = new Vector2(C).subtract(B);
		const BClen = length(BCnorm);

		BCnorm.normalize();

		uBC = new Vector2(Q).subtract(B).dot(BCnorm) / BClen;
		vBC = new Vector2(C).subtract(Q).dot(BCnorm) / BClen;
	}

	// Calculate CA barycentric coordinates.
	{
		const CAnorm = new Vector2(A).subtract(C);
		const CAlen = length(CAnorm);

		CAnorm.normalize();

		uCA = new Vector2(Q).subtract(C).dot(CAnorm) / CAlen;
		vCA = new Vector2(A).subtract(Q).dot(CAnorm) / CAlen;
	}

	const P = new Vector2(0, 0);

	response.closest = P;

	// 1. Test vertex regions
	let regionResponse = testVertexRegions(A, B, C, uAB, vAB, uBC, vBC, uCA, vCA);

	if (regionResponse !== null) {
		P.set(regionResponse.closestVertex);

		response.distance = new Vector2(response.input).subtract(P).magnitude();
		response.uncontributingVertexIndices = regionResponse.uncontributingVertexIndices;

		return response;
	}

	let uABC, vABC, wABC;

	// Calculate ABC barycentric coordinates.
	{
		const abc = area(A, B, C);

		uABC = area(Q, B, C) / abc;
		vABC = area(A, Q, C) / abc;
		wABC = area(A, B, Q) / abc;
	}

	// 2. Test edge regions
	regionResponse = testEdgeRegions(A, B, C, uAB, vAB, uBC, vBC, uCA, vCA, uABC, vABC, wABC);

	if (regionResponse !== null) {
		P.set(regionResponse.closestVertex);

		response.distance = new Vector2(response.input).subtract(P).magnitude();
		response.uncontributingVertexIndices = regionResponse.uncontributingVertexIndices;

		return response;
	}

	// 3. Interior region
	P.set(Q);

	response.distance = new Vector2(response.input).subtract(P).magnitude();
	response.uncontributingVertexIndices = []; // All are contributing

	return response;
}

/**
 * @param {import("../src/math/index.js").Vector2[]} simplex
 * @param {import("../src/math/index.js").Vector2} input
 */
export function ClosestPointLine(simplex, input) {
	/**
	 * @type {ClosestPointResponse}
	 */
	const response = {};

	response.input = input;

	const A = simplex[0];
	const B = simplex[1];
	const Q = input;

	response.geometry = simplex;

	const n = new Vector2(B).subtract(A);
	const length = n.magnitude();
	n.normalize();

	const u = new Vector2(Q).subtract(A).dot(n) / length;
	const v = new Vector2(B).subtract(Q).dot(n) / length;

	if (u < 0) {
		response.closest = A;
		response.distance = new Vector2(response.input).subtract(response.closest).magnitude();
		response.uncontributingVertexIndices = [1]; // Index of B

		return response;
	}

	if (v < 0) {
		response.closest = B;
		response.distance = new Vector2(response.input).subtract(response.closest).magnitude();
		response.uncontributingVertexIndices = [0]; // Index of A

		return response;
	}

	const a = new Vector2(A).multiplyScalar(v);
	const b = new Vector2(B).multiplyScalar(u);

	response.closest = a.add(b);
	response.distance = new Vector2(response.input).subtract(response.closest).magnitude();
	response.uncontributingVertexIndices = []; // Both points are contributing

	return response;
}

/**
 * @param {import("../src/math/index.js").Vector2[]} simplex
 * @param {import("../src/math/index.js").Vector2} input
 */
export function ClosestPointPoint(simplex, input) {
	/**
	 * @type {ClosestPointResponse}
	 */
	const response = {};

	const closest = simplex[0];
	const distance = new Vector2(input).subtract(closest).magnitude();

	response.geometry = simplex;
	response.input = input;
	response.closest = closest;
	response.distance = distance;
	response.uncontributingVertexIndices = [];

	return response;
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
 * @param {import("../src/math/index.js").Vector2} A
 * @param {import("../src/math/index.js").Vector2} B
 * @param {import("../src/math/index.js").Vector2} C
 * @param {Number} uAB
 * @param {Number} vAB
 * @param {Number} uBC
 * @param {Number} vBC
 * @param {Number} uCA
 * @param {Number} vCA
 */
function testVertexRegions(A, B, C, uAB, vAB, uBC, vBC, uCA, vCA) {
	/**
	 * @type {RegionTestResponse}
	 */
	const response = {};

	if (uCA > 1 && uAB <= 0) {
		response.closestVertex = A;
		response.uncontributingVertexIndices = [1, 2]; // B and C

		return response;
	}

	if (uAB > 1 && uBC <= 0) {
		response.closestVertex = B;
		response.uncontributingVertexIndices = [0, 2]; // A and C

		return response;
	}

	if (uBC > 1 && uCA <= 0) {
		response.closestVertex = C;
		response.uncontributingVertexIndices = [0, 1]; // A and B

		return response;
	}

	// Not in any vertex region
	return null;
}

/**
 * @param {import("../src/math/index.js").Vector2} A
 * @param {import("../src/math/index.js").Vector2} B
 * @param {import("../src/math/index.js").Vector2} C
 * @param {Number} uAB
 * @param {Number} vAB
 * @param {Number} uBC
 * @param {Number} vBC
 * @param {Number} uCA
 * @param {Number} vCA
 * @param {Number} uABC
 * @param {Number} vABC
 * @param {Number} wABC
 */
function testEdgeRegions(A, B, C, uAB, vAB, uBC, vBC, uCA, vCA, uABC, vABC, wABC) {
	/**
	 * @type {RegionTestResponse}
	 */
	const response = {};

	if (uAB >= 0 && vAB >= 0 && wABC <= 0) {
		const a = new Vector2(A).multiplyScalar(vAB);
		const b = new Vector2(B).multiplyScalar(uAB);

		response.closestVertex = a.add(b);
		response.uncontributingVertexIndices = [2]; // C

		return response;
	}

	if (uBC >= 0 && vBC >= 0 && uABC <= 0) {
		const b = new Vector2(B).multiplyScalar(vBC);
		const c = new Vector2(C).multiplyScalar(uBC);

		response.closestVertex = b.add(c);
		response.uncontributingVertexIndices = [0]; // A

		return response;
	}

	if (uCA >= 0 && vCA >= 0 && vABC <= 0) {
		const c = new Vector2(C).multiplyScalar(vCA);
		const a = new Vector2(A).multiplyScalar(uCA);

		response.closestVertex = c.add(a);
		response.uncontributingVertexIndices = [1]; // B

		return response;
	}

	// Not in any edge region
	return null;
}

/**
 * @param {import("../src/index.js").Object} polygon
 * @param {import("../src/math/index.js").Vector2} D
 */
function support(polygon, D) {
	/**
	 * @type {SupportResponse}
	 */
	const response = {};

	const vertices = polygon.getGeometry().getVertices();

	response.index = 0;
	let maxAngle = dot(vertices[response.index], D);

	for (let i = response.index + 1; i < vertices.length; i++) {
		const angle = dot(vertices[i], D);

		if (angle > maxAngle) {
			response.index = i;
			maxAngle = angle;
		}
	}

	response.vertex = new Vector2(vertices[response.index])//.add(polygon.getPosition());

	return response;
}

/**
 * @param {import("../src/math/index.js").Vector2[]} simplex
 * @param {import("../src/math/index.js").Vector2} Q
 */
function getClosestPoint(simplex, Q) {
	switch (simplex.length) {
		case 1:
			return ClosestPointPoint(simplex, Q);
		case 2:
			return ClosestPointLine(simplex, Q);
		case 3:
			return ClosestPointTriangle(simplex, Q);
		default:
			throw new Error("Closest point - Invalid simplex.");
	}
}

/**
 * @param {import("../src/math/index.js").Vector2[]} simplex
 * @param {import("../src/math/index.js").Vector2} Q
 * @param {import("../src/math/index.js").Vector2} P
 */
function getSearchDirection(simplex, Q, P) {
	switch (simplex.length) {
		case 1:
			// return new Vector2(simplex[0]).negate();
			return new Vector2(Q).subtract(P);
		case 2: {
			const ab = new Vector2(simplex[1]).subtract(simplex[0]);
			const sign = cross(ab, new Vector2(simplex[0]).negate());
			let D;

			if (sign > 0) {
				D = new Vector2(-ab.y, ab.x);
			}
			else {
				D = new Vector2(ab.y, -ab.x);
			}

			if (dot(D, new Vector2(Q).subtract(simplex[0])) <= 0) {
				D.negate();
			}

			return D;
		}
		default:
			throw new Error("Search direction - Invalid simplex.");
	}
}

/**
 * @param {import("../src/math/index.js").Vector2[]} simplex
 * @param {import("../src/math/index.js").Vector2} q
 */
function simplexContains(simplex, q) {
	for (let i = 0; i < simplex.length; i++) {
		const p = simplex[i];

		if (p.x === q.x && p.y === q.y) {
			return true;
		}
	}

	return false;
}

/**
 * If termination should occur, return true.
 * Otherwise return false.
 */
function checkTermination() {
	return true;
}