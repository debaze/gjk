import {Application} from "./index.js";
import {clamp, cross, inverse, Matrix3, pi, Vector2, Vector3} from "./math/index.js";

export class Renderer {
	static #AXIS_TEXT_COLOR = "#cccccc";
	static #DEBUG_TEXT_COLOR = "#757575";
	static #INTERSECTION_EDGE_COLOR = "#ff746c";
	static #INTERSECTION_BACKGROUND_COLOR = "#ff746c45";
	static #POLYTOPE_COLOR = "#ff9800";
	static #COLLISION_COLOR = "#670066";

	// Background
	static #BACKGROUND_COLOR = "#111111";

	// Grid
	static #GRID_COLUMN_GAP = 1;
	static #GRID_ROW_GAP = 1;
	static #GRID_COLOR = "#222222";

	// Axes
	static #AXIS_COLOR = "#333333";

	// Hovering
	static #HOVER_FILL_COLOR = "#273ea520";
	static #HOVER_STROKE_COLOR = "#273ea550";

	// Debug
	static #DEBUG_TOOLTIP_MARGIN = new Vector2(8, 8);
	static #DEBUG_TOOLTIP_SIZE = new Vector2(120, 30);
	static #DEBUG_TOOLTIP_BACKGROUND_COLOR = "#000000a0";

	#canvas;

	/**
	 * @type {?CanvasRenderingContext2D}
	 */
	#context = null;

	/**
	 * @type {?import("./Application.js").View}
	 */
	#view = null;

	#debugTooltipSize = new Vector2(Renderer.#DEBUG_TOOLTIP_SIZE);

	/**
	 * @type {?import("./index.js").Scene}
	 */
	#scene = null;

	constructor() {
		this.#canvas = document.createElement("canvas");
		this.#context = this.#canvas.getContext("2d");

		if (this.#context === null) {
			throw new Error("Could not get a 2D rendering context.");
		}
	}

	getCanvas() {
		return this.#canvas;
	}

	getScene() {
		return this.#scene;
	}

	/**
	 * @param {import("./index.js").Scene} scene
	 */
	setScene(scene) {
		this.#scene = scene;
	}

	render() {
		this.#clear();

		this.#renderGrid();
		this.#renderAxes();

		this.#renderScene()

		if (this.#scene.getGJKResponse() !== null) {
			this.#renderGJKResponse(this.#scene.getGJKResponse());
		}

		if (this.#scene.getClosestPointResponse() !== null) {
			this.#renderClosestPointResponse(this.#scene.getClosestPointResponse());
		}

		if (this.#scene.getMinkowskiDifference() !== null) {
			this.#renderMinkowskiDifference(this.#scene.getMinkowskiDifference());
		}

		this.#renderDebug();
	}

	#clear() {
		const w = this.#view.viewport.x;
		const h = this.#view.viewport.y;

		this.#context.fillStyle = Renderer.#BACKGROUND_COLOR;
		this.#context.fillRect(-w * 0.5, -h * 0.5, w, h);
	}

	#renderGrid() {
		const w = this.#view.viewport.x;
		const h = this.#view.viewport.y;

		this.#context.strokeStyle = Renderer.#GRID_COLOR;
		this.#context.beginPath();

		// Draw columns.
		for (let x = Renderer.#GRID_COLUMN_GAP; x < w * 0.5; x += Renderer.#GRID_COLUMN_GAP) {
			this.#context.moveTo(-x, -h * 0.5);
			this.#context.lineTo(-x, h * 0.5);
			this.#context.moveTo(x, -h * 0.5);
			this.#context.lineTo(x, h * 0.5);
		}

		// Draw rows.
		for (let y = Renderer.#GRID_ROW_GAP; y < h * 0.5; y += Renderer.#GRID_ROW_GAP) {
			this.#context.moveTo(-w * 0.5, -y);
			this.#context.lineTo(w * 0.5, -y);
			this.#context.moveTo(-w * 0.5, y);
			this.#context.lineTo(w * 0.5, y);
		}

		this.#context.stroke();
	}

	#renderAxes() {
		const w = this.#view.viewport.x;
		const h = this.#view.viewport.y;

		this.#context.strokeStyle = Renderer.#AXIS_COLOR;
		this.#context.beginPath();

		// Draw horizontal axis.
		this.#context.moveTo(-w * 0.5, 0);
		this.#context.lineTo(w * 0.5, 0);

		// Draw vertical axis.
		this.#context.moveTo(0, -h * 0.5);
		this.#context.lineTo(0, h * 0.5);

		this.#context.stroke();
	}

	#renderScene() {
		const objects = this.#scene.getObjects();

		for (let objectIndex = 0; objectIndex < objects.length; objectIndex++) {
			const object = objects[objectIndex];

			this.#renderObject(object, objectIndex);
		}
	}

	/**
	 * @param {import("./index.js").Object} object
	 * @param {Number} index
	 */
	#renderObject(object, index) {
		const geometry = object.getGeometry();
		const vertices = geometry.getVertices();
		const p = object.getPosition();
		const v0 = vertices[0];

		this.#context.save();
		this.#context.beginPath();
		this.#context.translate(p.x, p.y);
		this.#context.moveTo(v0.x, v0.y);

		for (let vertexIndex = 1; vertexIndex < vertices.length; vertexIndex++) {
			const v = vertices[vertexIndex];

			this.#context.lineTo(v.x, v.y);
		}

		this.#context.lineTo(v0.x, v0.y);

		const mouse = new Vector2(this.#view.mouse).multiplyMatrix(this.#view.projection);
		const isHovering = this.#context.isPointInPath(mouse.x, mouse.y);

		// TODO: Move into Application
		/* if (isHovering) {
			this.#hoveredObjectIndex = index;

			this.#context.fillStyle = Renderer.#HOVER_FILL_COLOR;
			this.#context.strokeStyle = Renderer.#HOVER_STROKE_COLOR;
		}
		else {
			if (this.#hoveredObjectIndex === index) {
				this.#hoveredObjectIndex = null;
			}

			this.#context.fillStyle = object.getMaterial().getFillColor();
			this.#context.strokeStyle = object.getMaterial().getStrokeColor();
		} */
		this.#context.fillStyle = object.getMaterial().getFillColor();
		this.#context.strokeStyle = object.getMaterial().getStrokeColor();

		this.#context.fill();
		this.#context.stroke();
		this.#context.restore();
	}

	/**
	 * @param {import("../public/GJK.js").GJKResponse} gjkResponse
	 */
	#renderGJKResponse(gjkResponse) {
		if (gjkResponse.simplex.length >= 2) {
			this.#context.fillStyle = "orange";

			for (let i = 0; i < gjkResponse.simplex.length; i++) {
				const p = gjkResponse.simplex[i];

				this.#context.beginPath();
				this.#context.arc(p.x, p.y, 0.1, 0, pi * 2);
				this.#context.fill();
			}
		}

		if (gjkResponse.distance) {
			this.#context.strokeStyle = "orange";
			this.#context.beginPath();
			this.#context.moveTo(0, 0);
			this.#context.lineTo(gjkResponse.distance, 0);
			this.#context.stroke();
		}
	}

	/**
	 * @param {import("../public/Distance.js").ClosestPointResponse} response
	 */
	#renderClosestPointResponse(response) {
		this.#context.save();

		const q = response.input;

		// Draw query point.
		this.#context.fillStyle = "#ff746c";
		this.#context.beginPath();
		this.#context.arc(q.x, q.y, 0.1, 0, pi * 2);
		this.#context.fill();

		// Draw projected point.
		if (response.closest) {
			const P = response.closest;

			this.#context.fillStyle = "#ffee8c";
			this.#context.beginPath();
			this.#context.arc(P.x, P.y, 0.1, 0, pi * 2);
			this.#context.fill();
		}

		if (response.simplex) {
			const simplex = response.simplex;
			const p0 = simplex[0];

			this.#context.fillStyle = `${Renderer.#POLYTOPE_COLOR}20`;
			this.#context.strokeStyle = `${Renderer.#POLYTOPE_COLOR}50`;
			this.#context.beginPath();
			this.#context.moveTo(p0.x, p0.y);

			for (let i = 1; i < simplex.length; i++) {
				const p = simplex[i];

				this.#context.lineTo(p.x, p.y);
			}

			this.#context.lineTo(p0.x, p0.y);
			this.#context.fill();
			this.#context.stroke();
		}

		if (response.uncontributingVertexIndices.length !== 0) {
			this.#context.fillStyle = Renderer.#HOVER_STROKE_COLOR;

			for (let i = 0; i < response.uncontributingVertexIndices.length; i++) {
				const index = response.uncontributingVertexIndices[i];
				const p = response.geometry[index];

				this.#context.beginPath();
				this.#context.arc(p.x, p.y, 0.1, 0, pi * 2);
				this.#context.fill();
			}
		}

		this.#context.restore();
	}

	/**
	 * @param {import("../public/MinkowskiDifference.js").MinkowskiDifference} minkowskiDifference
	 */
	#renderMinkowskiDifference(minkowskiDifference) {
		this.#context.fillStyle = "#fff";

		for (let i = 0; i < minkowskiDifference.length; i++) {
			const p = minkowskiDifference[i];

			this.#context.beginPath();
			this.#context.arc(p.x, p.y, 0.1, 0, pi * 2);
			this.#context.fill();
		}
	}

	#renderDebug() {
		this.#renderDebugTooltip();
	}

	#renderDebugTooltip() {
		this.#context.fillStyle = Renderer.#DEBUG_TOOLTIP_BACKGROUND_COLOR;

		const tooltipX = (this.#view.mouse.x); // + Renderer.#DEBUG_TOOLTIP_MARGIN.x) / this.#zoomLevel;
		const tooltipY = (this.#view.mouse.y); // - Renderer.#DEBUG_TOOLTIP_MARGIN.y) / this.#zoomLevel;

		const flipX = Number(tooltipX + this.#debugTooltipSize.x <= this.#view.viewport.x * 0.5) * 2 - 1;
		const flipY = Number(tooltipY - this.#debugTooltipSize.y <= -this.#view.viewport.y * 0.5) * 2 - 1;

		this.#context.fillRect(tooltipX, tooltipY, this.#debugTooltipSize.x * flipX / this.#view.zoomLevel, this.#debugTooltipSize.y * flipY / this.#view.zoomLevel);

		this.#context.save();
		this.#context.font = "0.25px Arial";
		this.#context.fillStyle = "#fff";
		this.#context.scale(1, -1);
		this.#context.fillText(`${this.#view.mouse}`, tooltipX, -tooltipY + 0.35);
		this.#context.restore();
	}

	/**
	 * @param {import("./Application.js").View} view
	 */
	setView(view) {
		this.#view = view;

		this.#canvas.width = this.#view.viewport.x;
		this.#canvas.height = this.#view.viewport.y;

		this.#context.setTransform(this.#view.projection[0], 0, 0, this.#view.projection[4], this.#view.projection[6], this.#view.projection[7]);
		this.#context.lineWidth = 1 / this.#view.zoomLevel;
	}
}