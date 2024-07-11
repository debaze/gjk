import {Vector3} from "../src/math/index.js";
import {O} from "./main.js";

/**
 * @param {Vector3[]} simplex
 * @param {Vector3} D
 */
export function triangleCase(simplex, D) {
	const [c, b, a] = simplex;
	const ab = new Vector3(b).subtract(a);
	const ac = new Vector3(c).subtract(a);
	const ao = new Vector3(O).subtract(a);
	const abc = ab.cross(ac);

	if (abc.cross(ac).dot(ao) > 0) {
		if (ac.dot(ao) > 0) {
			simplex.length = 0;
			simplex.push(a, c);

			D.set(ac.cross(ao).cross(ac));

			return false;
		}

		starCase(simplex, D);

		return false;
	}

	if (ab.cross(abc).dot(ao) > 0) {
		starCase(simplex, D);

		return false;
	}

	return true;
}

/**
 * @param {Vector3[]} simplex
 * @param {Vector3} D
 */
function starCase(simplex, D) {
	const [, b, a] = simplex;
	const ab = new Vector3(b).subtract(a);
	const ao = new Vector3(O).subtract(a);

	if (ab.dot(ao) > 0) {
		simplex.length = 0;
		simplex.push(a, b);

		D.set(ab.cross(ao).cross(ab));
	} else {
		simplex.length = 0;
		simplex.push(a);

		D.set(ao);
	}
}