import {Vector3} from "../src/math/index.js";
import {Mesh} from "../src/Mesh/index.js";
import {negate} from "./helpers.js";

/**
 * @param {Mesh} mesh1
 * @param {Mesh} mesh2
 * @param {Vector3} D
 */
export function support(mesh1, mesh2, D) {
	const s0 = new Vector3(mesh1.getGeometry().support(D));
	s0.add(mesh1.getPosition());

	const s1 = new Vector3(mesh2.getGeometry().support(negate(new Vector3(D))));
	s1.add(mesh2.getPosition());

	return s0.subtract(s1);
}