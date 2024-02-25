import {PI, Vector2} from "../src/math/index.js";
import {Circle} from "../src/Shape/index.js";

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
let frameIndex = 0;

canvas.width = innerWidth;
canvas.height = innerHeight;
ctx.strokeStyle = "#fff";
ctx.lineWidth = .5;

const center = new Vector2(canvas.clientWidth, canvas.clientHeight).divideScalar(2);
const directionLength = 75;
const direction = new Vector2(0, 0);

const circle1 = new Circle(center, 100, "#ff9800");
const circle2 = new Circle(center.clone().subtract(new Vector2(50, 0)), 100, "#de1818");

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
 * @param {Vector2} supportPoint
 */
function renderSupportPoint(supportPoint) {
	ctx.fillStyle = "#de1818";

	ctx.beginPath();
	ctx.arc(supportPoint[0], supportPoint[1], 5, 0, PI * 2);
	ctx.fill();
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

	circle1.render(ctx);
	circle2.render(ctx);
	renderDirection(circle2.getPosition());
	renderSupportPoint(circle2.getSupportPoint(direction));
}

requestAnimationFrame(loop);