import {Vector3} from "../src/math/index.js";
import {Shape} from "../src/Shape/index.js";
import {lineCase} from "./lineCase.js";
import {O} from "./main.js";
import {support} from "./support.js";
import {triangleCase} from "./triangleCase.js";

const MAX_ITERATIONS = 8;

/**
 * @param {Shape} shape1
 * @param {Shape} shape2
 */
export function gjk(shape1, shape2) {
	/**
	 * Found (0, 1, 0) to result in no more than 3 iterations
	 * before getting a response
	 */
	const D = new Vector3(0, 1, 0);
	const s = support(shape1, shape2, D);

	if (s.dot(D) < 0) {
		return false;
	}

	const simplex = [
		s,
	];

	D.set(new Vector3(O).subtract(s));

	for (let i = 0; i < MAX_ITERATIONS; i++) {
		const a = support(shape1, shape2, D);

		if (a.dot(D) < 0) {
			return false;
		}

		simplex.push(a);

		if (simplex.length === 2) {
			lineCase(simplex, D);

			continue;
		}

		if (simplex.length === 3) {
			if (triangleCase(simplex, D)) {
				return true;
			}
		}
	}

	return false;
}