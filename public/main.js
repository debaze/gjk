import {PI, Vector2} from "../src/math/index.js";
import {Circle} from "../src/Shape/index.js";

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
let frameIndex = 0;

canvas.width = innerWidth;
canvas.height = innerHeight;
ctx.strokeStyle = "#ffcc03";

const center = new Vector2(canvas.clientWidth, canvas.clientHeight).divideScalar(2);
const directionLength = 25;
const direction = new Vector2(0, 0);

const circle = new Circle(center, 50);

function renderDirection() {
	ctx.beginPath();
	ctx.moveTo(center[0], center[1]);
	ctx.lineTo(center[0] + direction[0], center[1] + direction[1]);
	ctx.stroke();
}

function loop() {
	requestAnimationFrame(loop);

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	direction[0] = Math.cos(frameIndex * PI / 180) - Math.sin(frameIndex * PI / 180) * directionLength;
	direction[1] = Math.sin(frameIndex * PI / 180) + Math.cos(frameIndex * PI / 180) * directionLength;

	circle.render(ctx);
	renderDirection();

	frameIndex++;
}

requestAnimationFrame(loop);