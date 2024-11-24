import {Vector3} from "../src/math/index.js";

/**
 * @typedef {Vector3[]} MinkowskiDifference
 */

/**
 * @param {import("../src/index.js").Object} object1
 * @param {import("../src/index.js").Object} object2
 */
export function GetMinkowskiDifference(object1, object2) {
	const object1Vertices = object1.getGeometry().getVertices();
	const object2Vertices = object2.getGeometry().getVertices();
	const differences = [];

	for (let i = 0; i < object2Vertices.length; i++) {
		for (let j = 0; j < object1Vertices.length; j++) {
			const v0 = new Vector3(object2Vertices[i]).add(object2.getPosition());
			const v1 = new Vector3(object1Vertices[j]).add(object1.getPosition());

			differences.push(v0.subtract(v1));
		}
	}

	return differences;
}