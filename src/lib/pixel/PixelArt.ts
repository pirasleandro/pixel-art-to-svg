import Pixel from './Pixel';

export default class PixelArt {
	public readonly pixels: Pixel[][] = [];

	public get width() {
		return this.pixels[0].length;
	}

	public get height() {
		return this.pixels.length;
	}

	constructor(pixels: Pixel[][]) {
		this.pixels = pixels;
	}

	public static async fromFile(file: File) {
		const pixels = await this.getPixels(file);
		return new PixelArt(pixels);
	}

	private static getPixels(file: File): Promise<Pixel[][]> {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d')!;

		return new Promise((resolve) => {
			const img = new Image();
			const url = URL.createObjectURL(file);

			img.onload = function () {
				// Set canvas size to match the image
				canvas.width = img.width;
				canvas.height = img.height;

				console.log(img.width, img.height);

				// Draw the image onto the canvas
				ctx.drawImage(img, 0, 0);

				// Get the pixel data
				const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				const pixels = imageData.data; // This is a flat array

				console.log(imageData.width, imageData.height);

				const retval: Pixel[][] = new Array(imageData.height).fill(null).map((_) => []);

				// Loop through each pixel
				for (let y = 0; y < imageData.height; y++) {
					retval[y] = new Array(imageData.width).fill(null);
					for (let x = 0; x < imageData.width; x++) {
						// Calculate the index of the pixel in the flat array
						const index = (y * imageData.width + x) * 4;
						const red = pixels[index]; // Red channel
						const green = pixels[index + 1]; // Green channel
						const blue = pixels[index + 2]; // Blue channel
						const alpha = pixels[index + 3]; // Alpha channel

						retval[y][x] = new Pixel(x, y, red, green, blue, alpha);
					}
				}

				// Clean up the object URL
				URL.revokeObjectURL(url);

				resolve(retval);
			};

			img.src = url;
		});
	}

	findAreas(): Record<number, Set<Pixel>> {
		const areas: Record<number, Set<Pixel>> = {};

		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				const pixel = this.pixels[y][x];
				const hex = pixel.hex;
				if (!areas[hex]) areas[hex] = new Set<Pixel>();
				areas[hex].add(pixel);
			}
		}

		return areas;
	}

	public cordsValid(x: number, y: number) {
		return y >= 0 && x >= 0 && y < this.height && x < this.width;
	}

	public get(x: number, y: number): Pixel | undefined {
		return this.cordsValid(x, y) ? this.pixels[y][x] : undefined;
	}

	// prettier-ignore
	private static readonly relativeNeighbourCords: [y: number, x: number][] = [
    [-1, -1], [-1, 0], [-1, 1],
    [ 0, -1],          [ 0, 1],
    [ 1, -1], [ 1, 0], [ 1, 1],
  ];

	getNeighbours(pixel: Pixel): Pixel[] {
		const retval = PixelArt.relativeNeighbourCords
			.map(([y, x]) => [pixel.y + y, pixel.x + x])
			.filter(([y, x]) => this.cordsValid(x, y))
			.map(([y, x]) => this.pixels[y][x]);
		return retval;
	}
}
