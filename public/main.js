import {Vector3} from "../src/math/index.js";
import {Circle, Shape} from "../src/Shape/index.js";
import {lineCase} from "./lineCase.js";
import {support} from "./support.js";
import {triangleCase} from "./triangleCase.js";

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
export const O = new Vector3(0, 0, 0);
const MAX_ITERATIONS = 64;

const shape1 = new Circle(new Vector3(-150, O[1], O[2]), 100, "royalblue");
const shape2 = /* new Polygon(new Vector3(20, O[1], O[2]), [
	new Vector3(-60, 40),
	new Vector3(0, -60),
	new Vector3(60, 40),
], "peachpuff"); */new Circle(new Vector3(-40, O[1], O[2]), 70, "peachpuff");

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

		if (simplex.length === 2) {
			lineCase(simplex, D);

			continue;
		}

		if (simplex.length === 3) {
			if (triangleCase(simplex, D)) {
				return true;
			}
		}
	}

	return false;
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