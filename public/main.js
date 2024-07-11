import {Vector3} from "../src/math/index.js";
import {Circle, Polygon, Shape} from "../src/Shape/index.js";

/**
 * @type {HTMLCanvasElement}
 */
// @ts-ignore
const canvas = document.querySelector("canvas");
/**
 * @type {CanvasRenderingContext2D}
 */
// @ts-ignore
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

const center = new Vector3(canvas.clientWidth, canvas.clientHeight, 0).divideScalar(2);
const O = new Vector3(0, 0, 0);
const MAX_ITERATIONS = 64;

const shape1 = new Circle(new Vector3(-150, O[1], O[2]), 100, "royalblue");
const shape2 = new Polygon(new Vector3(20, O[1], O[2]), [
	new Vector3(-60, 40),
	new Vector3(0, -60),
	new Vector3(60, 40),
], "peachpuff");

/**
 * @param {Shape} shape1
 * @param {Shape} shape2
 */
function gjk(shape1, shape2) {
	const D = new Vector3(1, 0, 0);
	const s = support(shape1, shape2, new Vector3(1, 0, 0));

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

		if (handleSimplex(simplex, D)) {
			return true;
		}
	}

	return false;
}

/**
 * @param {Vector3[]} simplex
 * @param {Vector3} direction
 */
function handleSimplex(simplex, direction) {
	if (simplex.length === 2) {
		return lineCase(simplex, direction);
	}

	return triangleCase(simplex, direction);
}

/**
 * @param {Vector3[]} simplex
 * @param {Vector3} direction
 */
function lineCase(simplex, direction) {
	const [a, b] = simplex;
	const ab = new Vector3(b).subtract(a);
	const ao = new Vector3(O).subtract(a);

	if (ab.dot(ao) > 0) {
		direction.set(ab.cross(ao).cross(ab));
	} else {
		simplex.length = 0;
		simplex.push(a);
		direction.set(ao);
	}

	return false;
}

/**
 * @param {Vector3[]} simplex
 * @param {Vector3} direction
 */
function triangleCase(simplex, direction) {
	const [a, b, c] = simplex;
	const ab = new Vector3(b).subtract(a);
	const ac = new Vector3(c).subtract(a);
	const ao = new Vector3(O).subtract(a);
	const abc = ab.cross(ac);

	if (abc.cross(ac).dot(ao) > 0) {
		if (ac.dot(ao) > 0) {
			simplex.length = 0;
			simplex.push(a, c);
			direction.set(ac.cross(ao).cross(ac));
		} else {
			simplex.length = 0;
			simplex.push(a, b);

			return lineCase(simplex, direction);
		}
	} else {
		if (ab.cross(abc).dot(ao) > 0) {
			simplex.length = 0;
			simplex.push(a, b);

			return lineCase(simplex, direction);
		} else {
			return true;
		}
	}

	return false;
}

/**
 * @param {Shape} shape1
 * @param {Shape} shape2
 * @param {Vector3} direction
 */
function support(shape1, shape2, direction) {
	const s0 = shape1.getFarthestSupportPoint(direction);
	const s1 = shape2.getFarthestSupportPoint(new Vector3(O).subtract(direction));
	const s = new Vector3(s0).subtract(s1);

	return s;
}

function renderCollisionInfo() {
	ctx.save();
		ctx.fillStyle = "#ffffff";

		ctx.fillRect(8, 8, 24, 24);
	ctx.restore();
}

function loop() {
	requestAnimationFrame(loop);

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.save();
		shape1.render(ctx, center);

		ctx.stroke();
	ctx.restore();

	ctx.save();
		shape2.render(ctx, center);

		ctx.stroke();
	ctx.restore();

	if (gjk(shape1, shape2)) {
		renderCollisionInfo();
	}
}

requestAnimationFrame(loop);

canvas.addEventListener("mousemove", function(event) {
	const position = new Vector3(event.clientX, event.clientY, 0).subtract(center);

	shape2.setPosition(position);
});