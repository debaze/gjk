import {Geometry} from "../src/Geometry/index.js";
import {Vector3} from "../src/math/index.js";
import {negate} from "./negate.js";

/**
 * @param {Geometry} g1
 * @param {Geometry} g2
 * @param {Vector3} D
 */
export function support(g1, g2, D) {
	const s0 = g1.support(D);
	const s1 = g2.support(negate(new Vector3(D)));
	const s = new Vector3(s0).subtract(s1);

	return s;
}