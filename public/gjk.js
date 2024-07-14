import {Geometry} from "../src/Geometry/index.js";
import {Vector3} from "../src/math/index.js";
import {check1dSimplex} from "./check1dSimplex.js";
import {check2dSimplex} from "./check2dSimplex.js";
import {check3dSimplex} from "./check3dSimplex.js";
import {negate} from "./negate.js";
import {support} from "./support.js";

/**
 * Max iterations tested: 4
 */
const MAX_ITERATIONS = 8;

/**
 * @param {Geometry} g1
 * @param {Geometry} g2
 */
export function gjk(g1, g2) {
	/**
	 * Found (0, 1, 0) to result in no more than 3 iterations
	 * before getting a response
	 */
	const D = new Vector3(0, 1, 0);
	const a = support(g1, g2, D);

	if (a.dot(D) < 0) {
		return null;
	}

	const simplex = [a];

	D.set(a);
	negate(D);

	for (let i = 0; i < MAX_ITERATIONS; i++) {
		const a = support(g1, g2, D);

		if (a.dot(D) < 0) {
			return null;
		}

		simplex.push(a);

		if (simplex.length === 2) {
			check1dSimplex(simplex, D);

			continue;
		}

		if (simplex.length === 3) {
			check2dSimplex(simplex, D);

			continue;
		}

		if (simplex.length === 4) {
			if (check3dSimplex(simplex, D)) {
				return simplex;
			}
		}
	}

	return null;
}