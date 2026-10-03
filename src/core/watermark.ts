export interface WatermarkOptions {
  type: 'CLOCK IN' | 'CLOCK OUT';
  datetime: string;
  location: string;
}

export function drawWatermark(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  options: WatermarkOptions
): void {
  const width = canvas.width;
  const height = canvas.height;

  const fontSize = Math.max(14, Math.floor(width / 40));
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textBaseline = 'top';

  const lines = [
    'Kalatera',
    options.type,
    options.datetime,
    options.location,
  ];

  const padding = fontSize;
  const lineHeight = fontSize * 1.4;
  const boxHeight = lines.length * lineHeight + padding * 2;
  const boxY = height - boxHeight;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, boxY, width, boxHeight);

  ctx.fillStyle = 'white';
  ctx.shadowColor = 'black';
  ctx.shadowBlur = 4;

  lines.forEach((line, i) => {
    const y = boxY + padding + i * lineHeight;
    ctx.fillText(line, padding, y);
  });

  ctx.shadowBlur = 0;
}
