import {PI, Vector2, Vector3, Vector4} from "./math/index.js";
import {Mesh} from "./Mesh/index.js";

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
			throw new Error("Unable to get a 2D rendering context");
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
	 * @param {Mesh} mesh1
	 * @param {Mesh} mesh2
	 * @param {Boolean} intersecting
	 */
	render(mesh1, mesh2, intersecting) {
		const v = this.#viewport;

		this.#context.clearRect(v[0], v[1], v[2], v[3]);

		this.#renderGrid();
		this.#renderAxes();
		this.#renderOrigin();
		this.#renderMesh(mesh1, intersecting);
		this.#renderMesh(mesh2, intersecting);
		this.#renderSupport(mesh1);
		this.#renderSupport(mesh2);
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
	 * @param {Mesh} mesh
	 * @param {Boolean} intersecting
	 */
	#renderMesh(mesh, intersecting) {
		const position = mesh.getPosition();
		const geometry = mesh.getGeometry();
		const material = mesh.getMaterial();

		this.#context.save();

		if (intersecting) {
			this.#context.fillStyle = Renderer.#INTERSECTION_BACKGROUND_COLOR;
			this.#context.strokeStyle = Renderer.#INTERSECTION_EDGE_COLOR;
		} else {
			this.#context.fillStyle = `${material.getColor()}45`;
			this.#context.strokeStyle = material.getColor();
		}

		geometry.render(this.#context, position, this.#origin);

		this.#context.stroke();
		this.#context.fill();

		this.#context.restore();
	}

	/**
	 * @param {Mesh} mesh
	 */
	#renderSupport(mesh) {
		const O = this.#origin;
		const D = new Vector3(-1, 0, 0);
		const support = new Vector3(mesh.getGeometry().support(D));
		support.add(mesh.getPosition());

		this.#context.save();

		this.#context.fillStyle = "#de1818";

		this.#context.beginPath();
		this.#context.arc(support[0] + O[0], -support[1] + O[1], 2, 0, PI * 2);
		this.#context.fill();

		this.#context.restore();
	}
}