import {Vector2, Vector4} from "./math/index.js";
import {Shape} from "./Shape/index.js";

export class Renderer {
	static #COLUMN_GAP = 16;
	static #ROW_GAP = 16;
	static #AXIS_COLOR = "#cccccc";
	static #GRID_COLOR = "#eeeeee";
	static #AXIS_TEXT_COLOR = "#cccccc";
	static #DEBUG_TEXT_COLOR = "#757575";
	static #INTERSECTION_EDGE_COLOR = "#ff746c";
	static #INTERSECTION_BACKGROUND_COLOR = "#ff746c45";

	#canvas;
	#context;
	#origin;
	#viewport;

	constructor() {
		this.#canvas = document.createElement("canvas");
		this.#origin = new Vector2(0, 0);
		this.#viewport = new Vector4(0, 0, 0, 0);
		this.resize();

		const context = this.#canvas.getContext("2d");

		if (context === null) {
			throw new Error("Unable to get a 2D rendering ontext");
		}

		this.#context = context;
	}

	getCanvas() {
		return this.#canvas;
	}

	getContext() {
		return this.#context;
	}

	getOrigin() {
		return this.#origin;
	}

	getViewport() {
		return this.#viewport;
	}

	/**
	 * @param {Shape} shape1
	 * @param {Shape} shape2
	 * @param {Boolean} intersecting
	 */
	render(shape1, shape2, intersecting) {
		const v = this.#viewport;

		this.#context.clearRect(v[0], v[1], v[2], v[3]);

		this.#renderGrid();
		this.#renderAxes();
		this.#renderOrigin();

		this.#renderShape(shape1, intersecting);
		this.#renderShape(shape2, intersecting);
	}

	/**
	 * @param {Record.<String, *>} objects
	 */
	renderDebug(objects) {
		const objectEntries = Object.entries(objects);
		let y = 20;

		this.#context.fillStyle = Renderer.#DEBUG_TEXT_COLOR;
		this.#context.font = "12px Consolas";

		for (const [name, value] of objectEntries) {
			this.#context.fillText(`${name}: ${value}`, 8, y);

			y += 12;
		}
	}

	resize() {
		this.#canvas.width = innerWidth;
		this.#canvas.height = innerHeight;

		this.#origin[0] = this.#canvas.width / 2;
		this.#origin[1] = this.#canvas.height / 2;

		this.#viewport[2] = this.#canvas.width;
		this.#viewport[3] = this.#canvas.height;
	}

	#renderGrid() {
		const O = this.#origin;
		const v = this.#viewport;

		this.#context.strokeStyle = Renderer.#GRID_COLOR;
		this.#context.beginPath();

		// Render negative columns
		for (let x = O[0]; x > v[0]; x -= Renderer.#COLUMN_GAP) {
			this.#context.moveTo(x, v[1]);
			this.#context.lineTo(x, v[3]);
		}

		// Render positive columns
		for (let x = O[0]; x < v[2]; x += Renderer.#COLUMN_GAP) {
			this.#context.moveTo(x, v[1]);
			this.#context.lineTo(x, v[3]);
		}

		// Render positive rows
		for (let y = O[1]; y > v[1]; y -= Renderer.#ROW_GAP) {
			this.#context.moveTo(v[0], y);
			this.#context.lineTo(v[2], y);
		}

		// Render negative rows
		for (let y = O[1]; y < v[3]; y += Renderer.#ROW_GAP) {
			this.#context.moveTo(v[0], y);
			this.#context.lineTo(v[2], y);
		}

		this.#context.stroke();
	}

	#renderAxes() {
		const O = this.#origin;
		const v = this.#viewport;

		this.#context.strokeStyle = Renderer.#AXIS_COLOR;
		this.#context.beginPath();

		// Render X axis
		this.#context.moveTo(v[0], O[1]);
		this.#context.lineTo(v[2], O[1]);

		// Render Y axis
		this.#context.moveTo(O[0], v[1]);
		this.#context.lineTo(O[0], v[3]);

		this.#context.stroke();
	}

	#renderOrigin() {
		const O = this.#origin;

		this.#context.fillStyle = Renderer.#AXIS_TEXT_COLOR;
		this.#context.font = "10px Consolas";
		this.#context.fillText("O", O[0] + 3, O[1] - 4);
	}

	/**
	 * @param {Shape} shape
	 * @param {Boolean} intersecting
	 */
	#renderShape(shape, intersecting) {
		this.#context.save();

		if (intersecting) {
			this.#context.fillStyle = Renderer.#INTERSECTION_BACKGROUND_COLOR;
			this.#context.strokeStyle = Renderer.#INTERSECTION_EDGE_COLOR;
		} else {
			this.#context.fillStyle = `${shape.getColor()}45`;
			this.#context.strokeStyle = shape.getColor();
		}

		shape.render(this.#context, this.#origin);

		this.#context.stroke();
		this.#context.fill();

		this.#context.restore();
	}
}