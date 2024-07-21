import {Vector3} from "../src/math/index.js";
import {Mesh} from "../src/Mesh/index.js";
import {check1dSimplex} from "./check1dSimplex.js";
import {check2dSimplex} from "./check2dSimplex.js";
import {negate} from "./helpers.js";
import {support} from "./support.js";

/**
 * Max iterations tested: 4
 */
const GJK_MAX_ITERATIONS = 8;

/**
 * Gilbert-Johnson-Keerthi
 * 
 * @param {Mesh} mesh1
 * @param {Mesh} mesh2
 */
export function gjk(mesh1, mesh2) {
	/**
	 * Found (0, 1, 0) to result in no more than 3 iterations
	 * before getting a response
	 */
	const D = new Vector3(0, 1, 0);
	const a = support(mesh1, mesh2, D);

	if (a.dot(D) < 0) {
		return null;
	}

	/**
	 * @type {import("./types.js").Simplex}
	 */
	const simplex = [a];

	D.set(a);
	negate(D);

	for (let i = 0; i < GJK_MAX_ITERATIONS; i++) {
		const a = support(mesh1, mesh2, D);

		if (a.dot(D) < 0) {
			return null;
		}

		simplex.push(a);

		if (simplex.length === 2) {
			check1dSimplex(simplex, D);

			continue;
		}

		if (simplex.length === 3) {
			/* check2dSimplex(simplex, D);

			continue; */

			// 2D test
			if (check2dSimplex(simplex, D)) {
				return simplex;
			}
		}

		/* if (simplex.length === 4) {
			if (check3dSimplex(simplex, D)) {
				return simplex;
			}
		} */
	}

	return null;
}