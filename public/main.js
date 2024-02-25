import {PI, Vector2} from "../src/math/index.js";
import {Circle} from "../src/Shape/index.js";
import {Polygon} from "../src/Shape/Polygon.js";

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

const circle = new Circle(center.clone().subtract(new Vector2(50, 0)), 100, "#de1818");
const polygon = new Polygon(center, [
	new Vector2(0, 0),
	new Vector2(200, 120),
	new Vector2(270, 300),
	new Vector2(100, 500),
	new Vector2(0, 0),
], "#ff9800");

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

	circle.render(ctx);
	polygon.render(ctx);
	renderDirection(polygon.getPosition());
	renderSupportPoint(polygon.getPosition(), polygon.getSupportPoint(direction));
}

requestAnimationFrame(loop);

canvas.addEventListener("mousemove", function(event) {
	const position = new Vector2(event.clientX, event.clientY);

	polygon.setPosition(position);
});