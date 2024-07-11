import {Vector3} from "../src/math/index.js";
import {Polygon} from "../src/Shape/index.js";
import {gjk} from "./gjk.js";

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

const shape1 = new Polygon(new Vector3(-50, 30, O[2]), [
	new Vector3(-30, 0, 0),
	new Vector3(0, 30, 0),
	new Vector3(30, 40, 0),
	new Vector3(60, 25, 0),
	new Vector3(80, 10, 0),
], "royalblue");
const shape2 = new Polygon(new Vector3(-25, 73.5, 0), [
	new Vector3(-60, 0, 0),
	new Vector3(0, 100, 0),
	new Vector3(60, 0, 0),
	new Vector3(70, -30, 0),
], "gold");

/**
 * @param {Object} object
 */
function renderDebug(object) {
	ctx.save();
		ctx.font = "20px Arial";
		ctx.fillStyle = "#ffffff";

		ctx.fillText(object.toString(), 38, 28);
	ctx.restore();
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
	const position = new Vector3(
		event.clientX - center[0],
		(-event.clientY + center[1]),
		center[2],
	);

	shape2.setPosition(position);
});