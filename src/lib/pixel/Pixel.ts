export interface IPixel {
	red: number;
	green: number;
	blue: number;
	alpha: number;
}

export default class Pixel implements IPixel {
	constructor(
		public readonly x: number,
		public readonly y: number,
		public readonly red: number,
		public readonly green: number,
		public readonly blue: number,
		public readonly alpha: number
	) {}

	get rgba() {
		return `rgba(${this.red},${this.green},${this.blue},${this.alpha / 256})`;
	}

	get hex() {
		return ((this.red * 256 + this.green) * 256 + this.blue) * 256 + this.alpha;
	}

	get hexStr() {
		return `#${this.hex.toString(16).padStart(8, '0')}`;
	}

	toString(): string {
		return `[${this.x},${this.y}](${this.hexStr})`;
	}
}
