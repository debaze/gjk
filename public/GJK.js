import {MinkowskiDifference} from "./MinkowskiDifference.js";
import {cross, distance, length, negate, Vector2} from "../src/math/index.js";
import {ClosestFeature} from "../src/ClosestFeature.js";

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

/**
 * @typedef {Object} GJKResponse
 * @property {import("../src/index.js").Object} object1 Reference to object 1
 * @property {import("../src/index.js").Object} object2 Reference to object 2
 * @property {import("../src/index.js").ClosestFeature} closestFeature1 Closest feature on object 1
 * @property {import("../src/index.js").ClosestFeature} closestFeature2 Closest feature on object 2
 * @property {import("../src/math/index.js").Vector2} closest1 Closest point on the closest feature on object 1
 * @property {import("../src/math/index.js").Vector2} closest2 Closest point on the closest feature on object 2
 * @property {Number} distance Distance between the closest points
 * @property {Boolean} intersecting
 * @property {Simplex} [simplex] Visualization purposes
 */

const GJK_MAX_ITERATIONS = 8;

// Max recorded = 4
let maxRecordedIterations = 0;

/**
 * @param {import("../src/index.js").Object} M1
 * @param {import("../src/index.js").Object} M2
 */
export function GJK(M1, M2) {
	/**
	 * @type {GJKResponse}
	 */
	const response = {};

	// D = COM(M2) - COM(M1)
	const D = new Vector2(M2.geometry.centerOfMass).subtract(M1.geometry.centerOfMass);
	const A = MinkowskiDifference.support(M1, M2, D);

	/**
	 * @type {Simplex}
	 */
	const S = [A];

	let i = 0;

	loop: for (; i <= GJK_MAX_ITERATIONS; i++) {
		const SCopy = [...S];

		if (S.length === 2) {
			ClosestPointLine(S);
		}
		else if (S.length === 3) {
			ClosestPointTriangle(S);
		}

		if (S.length === 3) {
			break;
		}

		// D ~= (0, 0) - P
		D.set(getSearchDirection(S));

		if (D.x === 0 && D.y === 0) {
			console.warn("Vertex overlap: D = (0, 0).");

			break;
		}

		const P = MinkowskiDifference.support(M1, M2, D);

		for (let i = 0; i < SCopy.length; i++) {
			if (P.index1 === SCopy[i].index1 && P.index2 === SCopy[i].index2) {
				break loop;
			}
		}

		S.push(P);
	}

	response.object1 = M1;
	response.object2 = M2;
	response.simplex = S;

	getClosestFeaturesOnPolygons(response, S);
	getClosestPointsOnPolygons(response, S);
	getDistanceAndIntersecting(response, S);

	if (response.closest1 && response.closest2) {
		response.closest1.multiplyMatrix(M1.transform);
		response.closest2.multiplyMatrix(M2.transform);
	}

	if (i > maxRecordedIterations) {
		maxRecordedIterations = i;

		console.warn("GJK max recorded iterations:", maxRecordedIterations);
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
		const abc = Vector2.area(A.vertex, B.vertex, C.vertex);

		uABC = Vector2.area(Q,        B.vertex, C.vertex) / abc;
		vABC = Vector2.area(A.vertex, Q,        C.vertex) / abc;
		wABC = Vector2.area(A.vertex, B.vertex, Q       ) / abc;
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
 * @param {Simplex} simplex
 */
function getSearchDirection(simplex) {
	switch (simplex.length) {
		case 1:
			return negate(simplex[0].vertex);
		case 2: {
			const ab = new Vector2(simplex[1].vertex).subtract(simplex[0].vertex);
			const sign = cross(ab, negate(simplex[0].vertex));

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
 * @param {GJKResponse} response
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

			break;
	}
}

/**
 * @param {GJKResponse} response
 * @param {Simplex} simplex
 */
function getDistanceAndIntersecting(response, simplex) {
	switch (simplex.length) {
		case 1:
		case 2:
			response.distance = distance(response.closest1, response.closest2);
			response.intersecting = false;

			break;
		case 3:
			response.distance = 0;
			response.intersecting = true;

			break;
	}
}

/**
 * @param {GJKResponse} response
 * @param {Simplex} simplex
 */
function getClosestFeaturesOnPolygons(response, simplex) {
	switch (simplex.length) {
		case 1:
			// Both closest features are vertices
			response.closestFeature1 = new ClosestFeature([
				simplex[0].vertex1,
			]);

			response.closestFeature2 = new ClosestFeature([
				simplex[0].vertex2,
			]);

			break;
		case 2:
			if (simplex[0].vertex1.x === simplex[1].vertex1.x && simplex[0].vertex1.y === simplex[1].vertex1.y) {
				// Closest feature 1 is a vertex
				response.closestFeature1 = new ClosestFeature([
					simplex[0].vertex1,
				]);
			}
			else {
				// Closest feature 1 is an edge
				response.closestFeature1 = new ClosestFeature([
					simplex[0].vertex1,
					simplex[1].vertex1,
				]);
			}

			if (simplex[0].vertex2.x === simplex[1].vertex2.x && simplex[0].vertex2.y === simplex[1].vertex2.y) {
				// Closest feature 2 is a vertex
				response.closestFeature2 = new ClosestFeature([
					simplex[0].vertex2,
				]);
			}
			else {
				// Closest feature 2 is an edge
				response.closestFeature2 = new ClosestFeature([
					simplex[0].vertex2,
					simplex[1].vertex2,
				]);
			}

			break;
	}
}