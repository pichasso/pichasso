const sharp = require('sharp');

function generate(error) {
  const width = error.message.length * 7 + 20;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink">
      <rect width="${width}" height="30" style="fill: white"/>
      <text x="10" y="20" font-family="monospace" style="fill: red">${error.message}</text>
  </svg>`;
  const svgBuffer = Buffer.alloc(svg.length, svg, 'utf8');

  return sharp(svgBuffer)
    .toFormat('png')
    .toBuffer();
}

module.exports = generate;
