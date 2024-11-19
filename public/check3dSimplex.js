import {Vector3} from "../src/math/index.js";
import {check2dSimplex} from "./check2dSimplex.js";

/**
 * @param {Vector3[]} simplex
 * @param {Vector3} D
 */
export function check3dSimplex(simplex, D) {
	const [d, c, b, a] = simplex;
	const ab = new Vector3(b).subtract(a);
	const ac = new Vector3(c).subtract(a);
	const ad = new Vector3(d).subtract(a);
	const bc = new Vector3(c).subtract(b);
	const cd = new Vector3(d).subtract(c);
	const db = new Vector3(b).subtract(d);
	const ao = new Vector3(a).negate();
	const abc = ab.cross(bc);
	const acd = ac.cross(cd);
	const adb = ad.cross(db);

	if (abc.dot(ao) > 0) {
		simplex.length = 0;
		simplex.push(a, b, c);

		return check2dSimplex(simplex, D);
	}

	if (acd.dot(ao) > 0) {
		simplex.length = 0;
		simplex.push(a, c, d);

		return check2dSimplex(simplex, D);
	}

	if (adb.dot(ao) > 0) {
		simplex.length = 0;
		simplex.push(a, d, b);

		return check2dSimplex(simplex, D);
	}

	return true;
}