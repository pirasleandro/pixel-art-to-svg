import type Pixel from './Pixel';
import type PixelArt from './PixelArt';

export default class Area extends Set<Pixel> {
  get hex() {
    return this.values().next().value?.hex;
  }

  get hexStr() {
    return this.values().next().value?.hexStr;
  }

  static printInPixelArt(area: Area, pixelArt: PixelArt) {
    let lines = [];
    for (let y = 0; y < pixelArt.height; y++) {
      let line = '';
      for (let x = 0; x < pixelArt.width; x++) {
        if (area.has(pixelArt.pixels[y][x])) {
          line += '██';
        } else {
          line += '  ';
        }
      }
      lines.push(line);
    }
    console.log('%c' + lines.join('\n'), `color:#${area.hex?.toString(16).padStart(8, '0')}`);
  }

  toBordered(pixelArt: PixelArt): Area {
    return new Area(
      [...this]
        .filter((pixel) => {
          const neighbours = pixelArt.getNeighbours(pixel);
          return (
            neighbours.length < 8 || neighbours.some((neighbour) => neighbour.hex !== this.hex)
          );
        })
        .sort((p1, p2) => p1.y - p2.y || p1.x - p2.x)
    );
  }

  printInPixelArt(pixelArt: PixelArt) {
    Area.printInPixelArt(this, pixelArt);
  }
}
