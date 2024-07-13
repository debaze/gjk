import {Vector3} from "../src/math/index.js";

/**
 * @param {Vector3} v
 */
export function negate(v) {
	v[0] *= -1;
	v[1] *= -1;
	v[2] *= -1;

	return v;
}