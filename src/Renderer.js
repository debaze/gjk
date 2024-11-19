import {clamp, inverse, Matrix3, Vector2, Vector3} from "./math/index.js";

export class Renderer {
	// Zoom
	static #MIN_ZOOM_LEVEL = 1;
	static #MAX_ZOOM_LEVEL = 8;

	static #AXIS_TEXT_COLOR = "#cccccc";
	static #DEBUG_TEXT_COLOR = "#757575";
	static #INTERSECTION_EDGE_COLOR = "#ff746c";
	static #INTERSECTION_BACKGROUND_COLOR = "#ff746c45";
	static #POLYTOPE_COLOR = "#ff9800";
	static #COLLISION_COLOR = "#670066";

	// Background
	static #BACKGROUND_COLOR = "#111111";

	// Grid
	static #GRID_COLUMN_GAP = 16;
	static #GRID_ROW_GAP = 16;
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

	#transform = Matrix3.identity();

	#transformInverse = Matrix3.identity();

	/**
	 * @type {?CanvasRenderingContext2D}
	 */
	#context = null;

	#viewport = new Vector2(0, 0);

	#resized = true;

	#transformed = true;

	#zoomLevel = Renderer.#MIN_ZOOM_LEVEL;

	#mouse = new Vector2(0, 0);

	#dragPosition = new Vector2(0, 0);

	#debugTooltipSize = new Vector2(Renderer.#DEBUG_TOOLTIP_SIZE);

	/**
	 * @type {?import("./index.js").Scene}
	 */
	#scene = null;

	/**
	 * @type {?Number}
	 */
	#hoveredObjectIndex = null;

	/**
	 * @type {?Number}
	 */
	#draggedObjectIndex = null;

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
		if (!this.#resized) {
			this.#resize();
		}

		if (!this.#transformed) {
			this.#updateTransform();
		}

		this.#clear();

		this.#renderGrid();
		this.#renderAxes();

		this.#renderScene();

		if (this.#hoveredObjectIndex !== null) {
			this.#renderDebug();
		}
	}

	/**
	 * @param {Vector2} client
	 */
	onMouseDown(client) {
		if (this.#hoveredObjectIndex === null) {
			return;
		}

		this.#draggedObjectIndex = this.#hoveredObjectIndex;

		this.#dragPosition.set(client);
		this.#dragPosition.multiplyMatrix(this.#transformInverse);
	}

	/**
	 * @param {Vector2} client
	 */
	onMouseMove(client) {
		this.#mouse.set(client);
		this.#mouse.multiplyMatrix(this.#transformInverse);

		if (this.#draggedObjectIndex !== null) {
			const object = this.#scene.getObjects()[this.#draggedObjectIndex];
			const drag = new Vector2(this.#mouse).subtract(this.#dragPosition);

			object.getPosition().add(new Vector3(drag.x, drag.y, 0));

			this.#dragPosition.set(this.#mouse);
		}
	}

	onMouseUp() {
		this.#dragPosition.reset();
		this.#draggedObjectIndex = null;
	}

	/**
	 * @param {Vector2} viewport
	 */
	onResize(viewport) {
		this.#viewport.set(viewport);

		this.#resized = false;
	}

	/**
	 * @param {Number} direction
	 */
	onScroll(direction) {
		this.#zoomLevel = clamp(this.#zoomLevel + direction, Renderer.#MIN_ZOOM_LEVEL, Renderer.#MAX_ZOOM_LEVEL);

		this.#transformed = false;
	}

	#clear() {
		const v = this.#viewport;

		this.#context.fillStyle = Renderer.#BACKGROUND_COLOR;
		this.#context.fillRect(-v.x * 0.5, -v.y * 0.5, v.x, v.y);
	}

	#renderGrid() {
		const v = this.#viewport;

		this.#context.strokeStyle = Renderer.#GRID_COLOR;
		this.#context.beginPath();

		// Draw columns.
		for (let x = Renderer.#GRID_COLUMN_GAP; x < v.x * 0.5; x += Renderer.#GRID_COLUMN_GAP) {
			this.#context.moveTo(-x, -v.y * 0.5);
			this.#context.lineTo(-x, v.y * 0.5);
			this.#context.moveTo(x, -v.y * 0.5);
			this.#context.lineTo(x, v.y * 0.5);
		}

		// Draw rows.
		for (let y = Renderer.#GRID_ROW_GAP; y < v.y * 0.5; y += Renderer.#GRID_ROW_GAP) {
			this.#context.moveTo(-v.x * 0.5, -y);
			this.#context.lineTo(v.x * 0.5, -y);
			this.#context.moveTo(-v.x * 0.5, y);
			this.#context.lineTo(v.x * 0.5, y);
		}

		this.#context.stroke();
	}

	#renderAxes() {
		const v = this.#viewport;

		this.#context.strokeStyle = Renderer.#AXIS_COLOR;
		this.#context.beginPath();

		// Draw horizontal axis.
		this.#context.moveTo(-v.x * 0.5, 0);
		this.#context.lineTo(v.x * 0.5, 0);

		// Draw vertical axis.
		this.#context.moveTo(0, -v.y * 0.5);
		this.#context.lineTo(0, v.y * 0.5);

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

		const mouse = new Vector2(this.#mouse).multiplyMatrix(this.#transform);
		const isHovering = this.#context.isPointInPath(mouse.x, mouse.y);

		if (isHovering) {
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
		}

		this.#context.fill();
		this.#context.stroke();

		this.#context.restore();
	}

	#renderDebug() {
		this.#renderDebugTooltip();
	}

	#renderDebugTooltip() {
		this.#context.fillStyle = Renderer.#DEBUG_TOOLTIP_BACKGROUND_COLOR;

		const tooltipX = (this.#mouse.x); // + Renderer.#DEBUG_TOOLTIP_MARGIN.x) / this.#zoomLevel;
		const tooltipY = (this.#mouse.y); // - Renderer.#DEBUG_TOOLTIP_MARGIN.y) / this.#zoomLevel;

		const flipX = Number(tooltipX + this.#debugTooltipSize.x <= this.#viewport.x * 0.5) * 2 - 1;
		const flipY = Number(tooltipY - this.#debugTooltipSize.y <= -this.#viewport.y * 0.5) * 2 - 1;

		this.#context.fillRect(tooltipX, tooltipY, this.#debugTooltipSize.x * flipX / this.#zoomLevel, this.#debugTooltipSize.y * flipY / this.#zoomLevel);
	}

	#resize() {
		this.#canvas.width = this.#viewport.x;
		this.#canvas.height = this.#viewport.y;

		this.#updateTransform();

		this.#resized = true;
	}

	#updateTransform() {
		const translationBias = new Vector2(1 - this.#viewport.x % 2, 1 - this.#viewport.y % 2);

		this.#transform.set(Matrix3.identity());
		this.#transform.multiply(Matrix3.translation(new Vector2(this.#viewport).add(translationBias).multiplyScalar(0.5)));
		this.#transform.multiply(Matrix3.scale(new Vector2(1, -1).multiplyScalar(this.#zoomLevel)));

		this.#transformInverse = inverse(this.#transform);

		this.#context.setTransform(this.#transform[0], 0, 0, this.#transform[4], this.#transform[6], this.#transform[7]);
		this.#context.lineWidth = 1 / this.#zoomLevel;

		this.#transformed = true;
	}
}