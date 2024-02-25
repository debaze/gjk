import {Vector2} from "../src/math/index.js";
import {Circle} from "../src/Shape/index.js";

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;
ctx.strokeStyle = "#ffcc03";

const center = new Vector2(canvas.clientWidth, canvas.clientHeight).divideScalar(2);

const circle = new Circle(center, 50);

function loop() {
	requestAnimationFrame(loop);

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	circle.render(ctx);
}

requestAnimationFrame(loop);