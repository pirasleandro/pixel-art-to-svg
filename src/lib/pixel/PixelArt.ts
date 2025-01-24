import Area from './Area';
import Pixel from './Pixel';
import Point, { directions } from './Point';

export default class PixelArt {
  public readonly filename: string;
  public readonly pixels: Pixel[][] = [];
  public readonly areas: Area[];

  public get width() {
    return this.pixels[0].length;
  }

  public get height() {
    return this.pixels.length;
  }

  constructor(filename: string, pixels: Pixel[][]) {
    this.filename = filename.split('.')[0];
    this.pixels = pixels;
    this.areas = this.findAreas();
  }

  public static async fromFile(file: File) {
    const pixels = await this.getPixels(file);
    return new PixelArt(file.name, pixels);
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

  private findAreas(): Area[] {
    const areaRecord: Record<number, Area> = {};

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const pixel = this.pixels[y][x];
        const hex = pixel.hex;
        if (!areaRecord[hex]) areaRecord[hex] = new Area();
        areaRecord[hex].add(pixel);
      }
    }

    return [...Object.values(areaRecord)];
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
  // prettier-ignore
  private static readonly orthRelativeNeighbourCords: [y: number, x: number][] = [
              [-1, 0],
    [ 0, -1],          [ 0, 1],
              [ 1, 0],
  ];
  // prettier-ignore
  private static readonly diagRelativeNeighbourCords: [y: number, x: number][] = [
    [-1, -1],          [-1, 1],

    [ 1, -1],          [ 1, 1],
  ];

  getNeighbours(pixel: Pixel): Pixel[] {
    const retval = PixelArt.relativeNeighbourCords
      .map(([y, x]) => [pixel.y + y, pixel.x + x])
      .filter(([y, x]) => this.cordsValid(x, y))
      .map(([y, x]) => this.pixels[y][x]);
    return retval;
  }

  getOrthogonalNeighbours(pixel: Pixel): Pixel[] {
    const retval = PixelArt.orthRelativeNeighbourCords
      .map(([y, x]) => [pixel.y + y, pixel.x + x])
      .filter(([y, x]) => this.cordsValid(x, y))
      .map(([y, x]) => this.pixels[y][x]);
    return retval;
  }

  getDiagonalNeighbours(pixel: Pixel): Pixel[] {
    const retval = PixelArt.diagRelativeNeighbourCords
      .map(([y, x]) => [pixel.y + y, pixel.x + x])
      .filter(([y, x]) => this.cordsValid(x, y))
      .map(([y, x]) => this.pixels[y][x]);
    return retval;
  }

  createPathAreas(pixelArt: PixelArt, hex: number, area: Area): Set<Pixel[]> {
    console.log('createPathForArea', hex, area);

    const bordered = area.toBordered(pixelArt);

    let head: Pixel | null = null;
    const paths = new Set<Pixel[]>();
    let path: Pixel[] = [];
    let timeout = 300;
    while (bordered.size > 0 && timeout > 0) {
      if (!head) {
        head = bordered.values().next().value!;
      }

      bordered.delete(head);
      path.push(head);

      const neighbours = pixelArt.getOrthogonalNeighbours(head);

      const noneFound = neighbours.every((neighbour) => {
        if (!bordered.has(neighbour) || path.includes(neighbour)) return true;
        bordered.delete(neighbour);
        head = neighbour;
        return false;
      });

      if (noneFound) {
        paths.add(path);
        path = [];
        head = null;
      }

      timeout--;
      if (timeout === 0) {
        console.error('timed out');
      }
    }

    if (path.length > 0) {
      paths.add(path);
    }

    return paths;
  }

  generateSvgPaths(): string[] {
    const paths: string[] = [];
    for (const area of this.areas) {
      if (area.hex === 0) continue;
      // area.printInPixelArt(this);
      paths.push(this.generateOptimizedSvgPath2(area));
    }
    return paths;
  }

  private generateOptimizedSvgPath(area: Area): string {
    const visitedEdges = new Set<string>(); // Track visited edges
    const pathCommands: string[] = [];

    const bordered = area.toBordered(this);

    const cursor: Point = bordered.values().next().value?.toPoint()!;
    if (!cursor) {
      throw new Error('Cannot generate svg path for area with no pixels.');
    }

    // Generate the path by "walking the edges" of each pixel
    bordered.forEach((pixel) => {
      const { x, y } = pixel;
      // Check all edges of the current pixel
      Object.values(directions).forEach((dir, i) => {
        const start = new Point(x, y); // Current corner
        const end = new Point(x + dir.x, y + dir.y); // Adjacent corner

        const edgeKey = `${start.toString()}|${end.toString()}`;
        const reverseEdgeKey = `${end.toString()}|${start.toString()}`;

        // If the edge hasn't been visited in either direction, it's part of the outer boundary
        if (!visitedEdges.has(edgeKey) && !visitedEdges.has(reverseEdgeKey)) {
          visitedEdges.add(edgeKey);

          if (i === 0) pathCommands.push(`M ${x},${y}`); // Move to start for the first edge
          pathCommands.push(`L ${end.x},${end.y}`); // Draw a line to the next corner
        }
      });
    });

    // Close the path to ensure it's a valid shape
    pathCommands.push('Z');

    // Combine all path commands into a single string
    const pathData = pathCommands.join(' ');

    // Return the complete SVG string
    return `<path d="${pathData}" fill="${area.hexStr}" stroke="none" />`;
  }

  private generateOptimizedSvgPath2(area: Area): string {
    const pathCommands: string[] = [];
    const pixels = [...area].toSorted((p1, p2) => p1.y - p2.y || p1.x - p2.x);

    type Line = [from: Pixel, to?: Pixel];
    const lines: Line[] = [];
    let line: Line | null = null;
    for (let i = 0; i < pixels.length; i++) {
      const pixel = pixels[i];
      if (!line) {
        line = [pixel];
      } else if (line[0].y === pixel.y && line[0].x + 1 === pixel.x) {
        line[1] = pixel;
      } else {
        lines.push(line);
        line = [pixel];
      }
    }
    if (line) lines.push(line);
    // console.log(lines);

    const pathData = lines
      .map((line) => `M ${line[0].x} ${line[0].y} H ${(line[1]?.x ?? line[0].x) + 1}`)
      .join(' ');
    // console.log(pathData);

    // Close the path to ensure it's a valid shape
    pathCommands.push('Z');

    // Combine all path commands into a single string
    // const pathData = pathCommands.join(' ');

    // Return the complete SVG string
    return `<path d="${pathData}" stroke="${area.hexStr}" />`;
  }

  toSvg(scale: number = 1): string {
    const retval = `<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${this.width * scale}px"
  height="${this.height * scale}px"
  viewBox="0 0 ${this.width} ${this.height}"
  shape-rendering="crispEdges"
>
  ${this.generateSvgPaths().join('\n  ')}
</svg>
`;
    return retval;
  }
}
