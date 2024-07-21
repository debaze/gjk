import {Vector3} from "../src/math/index.js";

/**
 * @param {Vector3} v
 */
export function negate(v) {
	v[0] = -v[0];
	v[1] = -v[1];
	v[2] = -v[2];

	return v;
}