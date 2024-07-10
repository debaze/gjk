import {Vector2, Vector3} from "../src/math/index.js";
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
ctx.strokeStyle = "#fff";
ctx.lineWidth = .5;

const center = new Vector2(canvas.clientWidth, canvas.clientHeight).divideScalar(2);
const O = new Vector3(0, 0, 0);

const shape1 = new Circle(O, 100, "#de1818");
const shape2 = new Polygon(O, [
	new Vector2(-60, 40),
	new Vector2(0, -60),
	new Vector2(60, 40),
], "#ff9800");

/**
 * @param {Shape} shape1
 * @param {Shape} shape2
 */
function gjk(shape1, shape2) {
	const d = getRandomDirection();
	const s = support(shape1, shape2, d);

	const simplex = [
		s,
	];

	d.set(new Vector3(O).subtract(s));

	while (true) {
		const a = support(shape1, shape2, d);

		if (a.dot(d) < 0) {
			return false;
		}

		simplex.push(a);

		if (handleSimplex(simplex, d)) {
			return true;
		}
	}
}

function getRandomDirection() {
	const randomAngle = Math.random() * 360;
	const direction = new Vector3(
		Math.cos(randomAngle) - Math.sin(randomAngle),
		Math.sin(randomAngle) + Math.cos(randomAngle),
		0,
	);

	return direction;
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
	const [b, a] = simplex;
	const ab = new Vector3(b).subtract(a);
	const ao = new Vector3(O).subtract(a);

	const ab_ao = ab.cross(ao);
	const ab_ao_ab = ab_ao.cross(ab);

	direction.set(ab_ao_ab);

	return false;
}

/**
 * @param {Vector3[]} simplex
 * @param {Vector3} direction
 */
function triangleCase(simplex, direction) {
	const [c, b, a] = simplex;
	const ab = new Vector3(b).subtract(a);
	const ac = new Vector3(c).subtract(a);
	const ao = new Vector3(O).subtract(a);

	const ac_ab = ac.cross(ab);
	const ac_ab_ab = ac_ab.cross(ab);

	const ab_ac = ab.cross(ac);
	const ab_ac_ac = ab_ac.cross(ac);

	// Region AB
	if (ac_ab_ab.dot(ao) > 0) {
		simplex.splice(0, 1);

		direction.set(ac_ab_ab);

		return false;
	}

	// Region AC
	if (ab_ac_ac.dot(ao) > 0) {
		simplex.splice(1, 1);

		direction.set(ab_ac_ac);

		return false;
	}

	return true;
}

/**
 * @param {Shape} shape1
 * @param {Shape} shape2
 * @param {Vector3} direction
 */
function support(shape1, shape2, direction) {
	const supportPoint = new Vector3();
	const direction2d = new Vector2(direction[0], direction[1]);

	supportPoint.set(
		new Vector2(shape1.getSupportPoint(direction2d))
			.subtract(shape2.getSupportPoint(new Vector2(O[0], O[1]).subtract(direction2d))),
	);

	return supportPoint;
}

/**
 * @param {Shape} shape
 */
function highlightShape(shape) {
	ctx.save();
		shape.render(ctx, center);

		ctx.fill();
	ctx.restore();
}

function loop() {
	requestAnimationFrame(loop);

	render();
}

function render() {
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
		highlightShape(shape1);
	}
}

requestAnimationFrame(loop);

canvas.addEventListener("mousemove", function(event) {
	const position = new Vector2(event.clientX, event.clientY).subtract(center);

	shape2.setPosition(position);
});