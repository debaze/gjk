import {Vector3} from "../math/Vector3.js";

/**
 * @param {import("../math/index.js").Vector3[]} unsortedPoints
 */
export function GiftWrapping(unsortedPoints) {
	const O = new Vector3(0, 0, 0);
	const n = unsortedPoints.length;
	const sortedPoints = [];

	for (let i = 0; i < unsortedPoints.length; i++) {
		O.add(unsortedPoints[i]);
	}

	O.divideScalar(unsortedPoints.length);

	sortedPoints.push(unsortedPoints[0]);

	for (let i = 1; i < n; i++) {
		const nextPointIndex = getNextPointIndex(unsortedPoints, O, sortedPoints[i - 1]);
		const nextPoint = unsortedPoints[nextPointIndex];

		unsortedPoints.splice(nextPointIndex, 1);

		sortedPoints.push(nextPoint);
	}

	return sortedPoints;
}

/**
 * @param {import("../math/index.js").Vector3[]} unsortedPoints
 * @param {import("../math/index.js").Vector3} center
 * @param {import("../math/index.js").Vector3} currentPoint
 */
function getNextPointIndex(unsortedPoints, center, currentPoint) {
	const currentNormal = new Vector3(currentPoint).subtract(center).normalize();
	let maxAngle = Number.NEGATIVE_INFINITY;
	let maxAngleIndex = 0;

	for (let i = 0; i < unsortedPoints.length; i++) {
		const normal = new Vector3(unsortedPoints[i]).subtract(center).normalize();
		const angle = currentNormal.dot(normal);

		if (angle > maxAngle) {
			maxAngle = angle;
			maxAngleIndex = i;
		}
	}

	return maxAngleIndex;
}