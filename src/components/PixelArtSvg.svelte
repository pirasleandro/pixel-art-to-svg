<script lang="ts">
  import type PixelArt from '$lib/pixel/PixelArt';

  let { pixelArt, scale = 1 }: { pixelArt: PixelArt; scale?: number } = $props();
</script>

<svg
  width={`${pixelArt.width * scale}px`}
  height={`${pixelArt.height * scale}px`}
  viewBox={`0 0 ${pixelArt.width} ${pixelArt.height}`}
>
  <!-- <rect width="1" height="1" x={pixel.x} y={pixel.y} fill={pixel.rgba} /> -->
  {#each pixelArt.generateSvgPaths() as path}
    {@html path}
  {/each}
</svg>
