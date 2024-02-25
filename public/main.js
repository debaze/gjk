import {PI, Vector2, Vector3} from "../src/math/index.js";
import {Circle, Polygon, Shape} from "../src/Shape/index.js";

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
let frameIndex = 0;

canvas.width = innerWidth;
canvas.height = innerHeight;
ctx.strokeStyle = "#fff";
ctx.lineWidth = .5;

const center = new Vector2(canvas.clientWidth, canvas.clientHeight).divideScalar(2);
const O = new Vector3(center[0], center[1], 0);
const directionLength = 75;
const direction = new Vector2(0, 0);

const shape1 = new Circle(center.clone().subtract(new Vector2(50, 0)), 100, "#de1818");
const shape2 = new Polygon(center, [
	new Vector2(-60, 40),
	new Vector2(0, -60),
	new Vector2(60, 40),
], "#ff9800");

/**
 * @param {Shape} shape1
 * @param {Shape} shape2
 */
function gjk(shape1, shape2) {
	const direction = new Vector3();
	
	direction.set(
		shape2
			.getPosition()
			.clone()
			.subtract(shape1.getPosition())
			.normalize(),
	);

	const simplex = [
		support(shape1, shape2, direction),
	];

	direction.set(O.clone().subtract(simplex[0]));

	while (true) {
		const a = support(shape1, shape2, direction);

		if (a.dot(direction) < 0) {
			return false;
		}

		simplex.push(a);

		if (handleSimplex(simplex, direction)) {
			return true;
		}
	}
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
	const ab = b.clone().subtract(a);
	const ao = O.clone().subtract(a);

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
	const ab = b.clone().subtract(a);
	const ac = c.clone().subtract(a);
	const ao = O.clone().subtract(a);

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
		shape1
			.getSupportPoint(direction2d)
			.clone()
			.subtract(shape2.getSupportPoint(direction2d)),
	);

	return supportPoint;
}

/**
 * @param {Vector2} position
 */
function renderDirection(position) {
	ctx.beginPath();
	ctx.moveTo(position[0], position[1]);
	ctx.lineTo(position[0] + direction[0], position[1] + direction[1]);
	ctx.stroke();
}

/**
 * @param {Vector2} position
 * @param {Vector2} supportPoint
 */
function renderSupportPoint(position, supportPoint) {
	ctx.fillStyle = "#de1818";

	ctx.beginPath();
	ctx.arc(position[0] + supportPoint[0], position[1] + supportPoint[1], 5, 0, PI * 2);
	ctx.fill();
}

/**
 * @param {Shape} shape
 */
function highlightShape(shape) {
	ctx.save();
		shape.render(ctx);

		ctx.fill();
	ctx.restore();
}

function loop() {
	requestAnimationFrame(loop);

	update(frameIndex);
	render();

	frameIndex++;
}

/**
 * @param {Number} frameIndex
 */
function update(frameIndex) {
	direction[0] = Math.cos(frameIndex * PI / 180) - Math.sin(frameIndex * PI / 180) * directionLength;
	direction[1] = Math.sin(frameIndex * PI / 180) + Math.cos(frameIndex * PI / 180) * directionLength;
}

function render() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.save();
		shape1.render(ctx);

		ctx.stroke();
	ctx.restore();

	ctx.save();
		shape2.render(ctx);

		ctx.stroke();
	ctx.restore();

	// renderDirection(shape2.getPosition());
	// renderSupportPoint(shape2.getPosition(), shape2.getSupportPoint(direction));

	if (gjk(shape1, shape2)) {
		highlightShape(shape1);
	}
}

requestAnimationFrame(loop);

canvas.addEventListener("mousemove", function(event) {
	const position = new Vector2(event.clientX, event.clientY);

	shape2.setPosition(position);
});