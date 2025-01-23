<script lang="ts">
  import PixelArt from '$lib/pixel/PixelArt';
  import type Pixel from '$lib/pixel/Pixel';
  import type { ChangeEventHandler } from 'svelte/elements';
  import PixelArtSvg from '../components/PixelArtSvg.svelte';
  import Area from '$lib/pixel/Area';

  const results: PixelArt[] = $state([]);

  const onchange: ChangeEventHandler<HTMLInputElement> = ({ currentTarget }) => {
    convertFiles(currentTarget?.files! ?? []);
  };

  async function convertFiles(files: FileList) {
    for (const file of files) {
      const pixelArt = await PixelArt.fromFile(file);
      results.push(pixelArt);
      /* console.log(pixels.map(row => row.map(pixel => pixel.hexStr).join(' ')).join('\n')); */
      /* const areas = pixelArt.findAreas();
      console.log('areas', areas);
      console.log('area-hexes', Object.keys(areas));
      for (const [hexStr, area] of Object.entries(areas)) {
        const hex = parseInt(hexStr);
        area.printInPixelArt(pixelArt);
        if (hex === 0) continue;
        const pathAreas = createPathForArea(pixelArt, hex, area);
        pathAreas.forEach((pathArea) => {
          new Area(pathArea).printInPixelArt(pixelArt);
        });
      } */
    }
  }

  function createPathForArea(pixelArt: PixelArt, hex: number, area: Area): Set<Pixel[]> {
    console.log('createPathForArea', hex, area);

    const bordered = new Area(
      [...area]
        .filter((pixel) => {
          const neighbours = pixelArt.getNeighbours(pixel);
          return neighbours.length < 8 || neighbours.some((neighbour) => neighbour.hex !== hex);
        })
        .sort((p1, p2) => p1.y - p2.y || p1.x - p2.x)
    );

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
</script>

<!-- <img src="https://banner-writer.web.app/image/L8.3J.png" /> -->
<input type="file" id="file-input" multiple {onchange} />
<canvas id="canvas"></canvas>
<div id="results">
  {#each results as pixelArt}
    <PixelArtSvg {pixelArt} scale={10} />
  {/each}
</div>
<svg id="svg-template" viewBox="0 0 16 16" width="160px" height="160px">
  <!-- <rect width=1 height=1 x=0 y=0 fill="rgba(0, 255, 0, 255)"></rect>
  <rect width=1 height=1 x=15 y=15 fill=orange></rect> -->
</svg>
