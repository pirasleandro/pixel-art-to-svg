<script lang="ts">
	import PixelArt from '$lib/pixel/PixelArt';
	import type Pixel from '$lib/pixel/Pixel';
	import type { ChangeEventHandler } from 'svelte/elements';
	import PixelArtSvg from '../components/PixelArtSvg.svelte';

	const results: PixelArt[] = $state([]);

	const onchange: ChangeEventHandler<HTMLInputElement> = ({ currentTarget }) => {
		convertFiles(currentTarget?.files! ?? []);
	};

	async function convertFiles(files: FileList) {
		for (const file of files) {
			const pixelArt = await PixelArt.fromFile(file);
			results.push(pixelArt);
			/* console.log(pixels.map(row => row.map(pixel => pixel.hexStr).join(' ')).join('\n')); */
			const areas = pixelArt.findAreas();
			console.log('areas', areas);
			for (const hex in areas) {
				console.log(hex);
			}
			const patharea = new Set<Pixel>(createPathForArea(pixelArt, 0, areas[0]));
			console.log('patharea', patharea);
			let lines = [];
			for (let y = 0; y < pixelArt.height; y++) {
				let line = '';
				for (let x = 0; x < pixelArt.width; x++) {
					if (patharea.has(pixelArt.pixels[y][x])) {
						line += '#';
					} else {
						line += '.';
					}
				}
				lines.push(line);
			}
			console.log(lines.join('\n'));
			/* Object.entries(areas).forEach(([hex, area]) => {
      console.log(createPathForArea(pixels, hex, area));
    }) */
		}
	}

	function createPathForArea(pixelArt: PixelArt, hex: number, area: Set<Pixel>) {
		console.log(area);

		return [...area].filter((pixel) => {
			const neighbours = pixelArt.getNeighbours(pixel);
			return neighbours.length < 8 || neighbours.some((neighbour) => neighbour.hex !== hex);
		});
	}
</script>

<!-- <img src="https://banner-writer.web.app/image/L8.3J.png" /> -->
<input type="file" id="file-input" multiple {onchange} />
<canvas id="canvas"></canvas>
<div id="results">
	{#each results as pixelArt}
		<PixelArtSvg {pixelArt} scale={5} />
	{/each}
</div>
<svg id="svg-template" viewBox="0 0 16 16" width="160px" height="160px">
	<!-- <rect width=1 height=1 x=0 y=0 fill="rgba(0, 255, 0, 255)"></rect>
  <rect width=1 height=1 x=15 y=15 fill=orange></rect> -->
</svg>
