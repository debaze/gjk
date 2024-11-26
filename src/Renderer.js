import {pi, Vector2} from "./math/index.js";

export class Renderer {
	static #INTERSECTION_EDGE_COLOR = "#ff746c";
	static #INTERSECTION_BACKGROUND_COLOR = "#ff746c45";
	static #SIMPLEX_FILL_COLOR = "#ff980020";
	static #SIMPLEX_STROKE_COLOR = "#ff980050";
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
		const v0 = vertices[0];

		this.#context.save();
		this.#context.translate(object.position.x, object.position.y);
		this.#context.rotate(-object.rotation);
		this.#context.scale(object.scale.x, object.scale.y);
		this.#context.beginPath();
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
	 * @param {import("../public/Distance.js").ClosestPointPolygonPolygonResponse} response
	 */
	#renderClosestPointResponse(response) {
		this.#context.save();

		// Draw simplex on the shapes.
		if (response.simplex) {
			const simplex = response.simplex;
			const p0 = response.object1.getGeometry().getVertices()[simplex[0].index1];

			this.#context.fillStyle = Renderer.#SIMPLEX_FILL_COLOR;
			this.#context.strokeStyle = Renderer.#SIMPLEX_STROKE_COLOR;

			this.#context.save();
			this.#context.translate(response.object1.position.x, response.object1.position.y);
			this.#context.rotate(-response.object1.rotation);
			this.#context.scale(response.object1.scale.x, response.object1.scale.y);
			this.#context.beginPath();
			// this.#context.arc(p0.x, p0.y, 0.1, 0, pi * 2);
			this.#context.moveTo(p0.x, p0.y);

			for (let i = 1; i < simplex.length; i++) {
				const p = response.object1.getGeometry().getVertices()[simplex[i].index1];

				this.#context.lineTo(p.x, p.y);
				// this.#context.moveTo(p.x, p.y);
				// this.#context.arc(p.x, p.y, 0.1, 0, pi * 2);
				// this.#context.moveTo(p.x, p.y);
			}

			this.#context.lineTo(p0.x, p0.y);
			this.#context.stroke();
			this.#context.fill();
			this.#context.restore();

			this.#context.save();

			this.#context.translate(response.object2.position.x, response.object2.position.y);
			this.#context.rotate(-response.object2.rotation);
			this.#context.scale(response.object2.scale.x, response.object2.scale.y);

			const p01 = response.object2.getGeometry().getVertices()[simplex[0].index2];

			this.#context.beginPath();
			// this.#context.arc(p01.x, p01.y, 0.1, 0, pi * 2);
			this.#context.moveTo(p01.x, p01.y);

			for (let i = 1; i < simplex.length; i++) {
				const p = response.object2.getGeometry().getVertices()[simplex[i].index2];

				this.#context.lineTo(p.x, p.y);
				// this.#context.moveTo(p.x, p.y);
				// this.#context.arc(p.x, p.y, 0.1, 0, pi * 2);
				// this.#context.moveTo(p.x, p.y);
			}

			this.#context.lineTo(p01.x, p01.y);
			this.#context.fill();
			this.#context.stroke();
			this.#context.restore();
		}

		// Draw closest point on shape 1.
		if (response.closest1) {
			const p1 = response.closest1;

			this.#context.fillStyle = Renderer.#HOVER_FILL_COLOR;
			this.#context.strokeStyle = Renderer.#HOVER_STROKE_COLOR;
			this.#context.beginPath();
			this.#context.arc(p1.x, p1.y, 0.1, 0, pi * 2);
			this.#context.fill();
			this.#context.stroke();
		}

		// Draw closest point on shape 2.
		if (response.closest2) {
			const p2 = response.closest2;

			this.#context.fillStyle = Renderer.#HOVER_FILL_COLOR;
			this.#context.strokeStyle = Renderer.#HOVER_STROKE_COLOR;
			this.#context.beginPath();
			this.#context.arc(p2.x, p2.y, 0.1, 0, pi * 2);
			this.#context.fill();
			this.#context.stroke();
		}

		if (response.closest1 && response.closest2) {
			const p1 = response.closest1;
			const p2 = response.closest2;

			this.#context.strokeStyle = Renderer.#HOVER_STROKE_COLOR;
			this.#context.beginPath();
			this.#context.moveTo(p1.x, p1.y);
			this.#context.lineTo(p2.x, p2.y);
			this.#context.stroke();
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