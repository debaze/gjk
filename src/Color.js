export class Color {
	#r;
	#g;
	#b;
	#a;

	/**
	 * @param {Number} r
	 * @param {Number} g
	 * @param {Number} b
	 */
	static rgb(r, g, b) {
		return new Color(r, g, b, 1);
	}

	/**
	 * @param {Number} r
	 * @param {Number} g
	 * @param {Number} b
	 * @param {Number} a
	 */
	static rgba(r, g, b, a) {
		return new Color(r, g, b, a);
	}

	/**
	 * @param {Number} r
	 * @param {Number} g
	 * @param {Number} b
	 * @param {Number} a
	 */
	constructor(r, g, b, a) {
		this.#r = r;
		this.#g = g;
		this.#b = b;
		this.#a = a;
	}

	/**
	 * @param {Number} a
	 */
	withAlpha(a) {
		return new Color(this.#r, this.#g, this.#b, a);
	}

	toString() {
		return `rgb(${this.#r}, ${this.#g}, ${this.#b}, ${this.#a})`;
	}
}