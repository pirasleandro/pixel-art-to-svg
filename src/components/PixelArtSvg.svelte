<script lang="ts">
  import type PixelArt from '$lib/pixel/PixelArt';

  let { pixelArt, scale = 1 }: { pixelArt: PixelArt; scale?: number } = $props();
</script>

<div class="file">
  <code style="font-size: 10px">{pixelArt.filename}</code>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={`${pixelArt.width * scale}px`}
    height={`${pixelArt.height * scale}px`}
    viewBox={`0 0 ${pixelArt.width} ${pixelArt.height}`}
    shape-rendering="crispEdges"
  >
    <!-- <rect width="1" height="1" x={pixel.x} y={pixel.y} fill={pixel.rgba} /> -->
    {#each pixelArt.generateSvgPaths() as path}
      {@html path}
    {/each}
  </svg>
</div>
