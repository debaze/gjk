import {Integrator, Renderer} from "./index.js";
import {Vector2} from "./math/index.js";

export class Application {
	#integrator = new Integrator();

	#renderer = new Renderer();

	/**
	 * @type {?import("./index.js").Scene}
	 */
	#scene = null;

	#resizeObserver = new ResizeObserver(this.#onResize.bind(this));

	#timeSinceLastFrame = 0;

	/**
	 * @type {?Number}
	 */
	#animationFrameRequestId = null;

	async initialize() {
		const canvas = this.#renderer.getCanvas();

		try {
			this.#resizeObserver.observe(canvas, {
				box: "device-pixel-content-box",
			});
		} catch {
			this.#resizeObserver.observe(canvas, {
				box: "content-box",
			});
		}

		canvas.addEventListener("mousedown", this.#onMouseDown.bind(this));
		canvas.addEventListener("mousemove", this.#onMouseMove.bind(this));
		canvas.addEventListener("mouseup", this.#onMouseUp.bind(this));
		canvas.addEventListener("wheel", this.#onWheel.bind(this), {
			passive: true,
		});
	}

	getRenderer() {
		return this.#renderer;
	}

	getScene() {
		return this.#scene;
	}

	/**
	 * @param {import("./index.js").Scene} scene
	 */
	setScene(scene) {
		this.#scene = scene;

		this.#renderer.setScene(scene);
	}

	startLoop() {
		if (this.#scene === null) {
			throw new Error("A scene must be provided before starting the loop.");
		}

		this.#timeSinceLastFrame = performance.now();

		this.#loop();
	}

	stopLoop() {
		window.cancelAnimationFrame(this.#animationFrameRequestId);

		this.#animationFrameRequestId = null;
	}

	#loop() {
		this.#animationFrameRequestId = requestAnimationFrame(this.#loop.bind(this));

		const time = performance.now();
		const deltaTime = time - this.#timeSinceLastFrame;

		this.#timeSinceLastFrame = time;

		try {
			this.#update(deltaTime);
			this.#render();
		}
		catch (error) {
			console.error(error);

			this.stopLoop();
		}
	}

	/**
	 * @param {Number} deltaTime
	 */
	#update(deltaTime) {
		// this.#integrator.update(this.#scene, deltaTime);
	}

	#render() {
		this.#renderer.render();
	}

	/**
	 * @param {MouseEvent} event
	 */
	#onMouseDown(event) {
		const client = new Vector2(event.clientX, event.clientY);

		// this.#integrator.onMouseDown(client);
		this.#renderer.onMouseDown(client);
	}

	/**
	 * @param {MouseEvent} event
	 */
	#onMouseMove(event) {
		const client = new Vector2(event.clientX, event.clientY);

		this.#renderer.onMouseMove(client);
	}

	/**
	 * @param {MouseEvent} event
	 */
	#onMouseUp(event) {
		this.#renderer.onMouseUp();
	}

	/**
	 * @type {ResizeObserverCallback}
	 */
	#onResize(entries) {
		const canvasEntry = entries[0];
		const devicePixelRatio = window.devicePixelRatio;
		const viewport = new Vector2(
			canvasEntry.devicePixelContentBoxSize?.[0].inlineSize ?? canvasEntry.contentBoxSize[0].inlineSize,
			canvasEntry.devicePixelContentBoxSize?.[0].blockSize ?? canvasEntry.contentBoxSize[0].blockSize,
		).multiplyScalar(devicePixelRatio);

		viewport.x |= 0;
		viewport.y |= 0;

		this.#renderer.onResize(viewport);
	}

	/**
	 * @param {WheelEvent} event
	 */
	#onWheel(event) {
		const direction = Math.sign(-event.deltaY);

		this.#renderer.onScroll(direction);
	}
}