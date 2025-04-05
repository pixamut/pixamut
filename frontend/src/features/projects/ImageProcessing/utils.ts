/**
 * Dithering function: reduces colors to e.g. 4 levels per channel (64-colors),
 * then distributes the quantization error to neighboring pixels.
 */
export const floydSteinbergDither = (
  imageData: ImageData,
  width: number,
  height: number,
  levelsPerChannel: number = 4,
  ditherFactor: number = 1,
) => {
  const data = imageData.data; // RGBA array

  // Each step is 255/(levelsPerChannel-1), e.g. if 4 levels => steps are 0, 85, 170, 255
  const step = 255 / (levelsPerChannel - 1);

  const snap = (val: number) => Math.round(Math.round(val / step) * step);

  // Helper to clamp a value to [0..255]
  const clamp = (val: number) => {
    return Math.min(255, Math.max(0, Math.round(val)));
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const oldR = data[idx];
      const oldG = data[idx + 1];
      const oldB = data[idx + 2];

      // Approximate each channel to the nearest step
      const newR = snap(oldR);
      const newG = snap(oldG);
      const newB = snap(oldB);

      data[idx] = newR;
      data[idx + 1] = newG;
      data[idx + 2] = newB;

      // Calculate the error
      const errR = oldR - newR;
      const errG = oldG - newG;
      const errB = oldB - newB;

      // Floyd–Steinberg dithering:
      //    (x+1, y)   += 7/16 * err
      //    (x-1, y+1) += 3/16 * err
      //    (x,   y+1) += 5/16 * err
      //    (x+1, y+1) += 1/16 * err

      // 1) (x+1, y)
      let neighborIdx = (y * width + (x + 1)) * 4;
      if (x + 1 < width) {
        data[neighborIdx] = clamp(
          data[neighborIdx] + errR * (7 / 16) * ditherFactor,
        );
        data[neighborIdx + 1] = clamp(
          data[neighborIdx + 1] + errG * (7 / 16) * ditherFactor,
        );
        data[neighborIdx + 2] = clamp(
          data[neighborIdx + 2] + errB * (7 / 16) * ditherFactor,
        );
      }

      // 2) (x-1, y+1)
      neighborIdx = ((y + 1) * width + (x - 1)) * 4;
      if (x - 1 >= 0 && y + 1 < height) {
        data[neighborIdx] = clamp(
          data[neighborIdx] + errR * (3 / 16) * ditherFactor,
        );
        data[neighborIdx + 1] = clamp(
          data[neighborIdx + 1] + errG * (3 / 16) * ditherFactor,
        );
        data[neighborIdx + 2] = clamp(
          data[neighborIdx + 2] + errB * (3 / 16) * ditherFactor,
        );
      }

      // 3) (x, y+1)
      neighborIdx = ((y + 1) * width + x) * 4;
      if (y + 1 < height) {
        data[neighborIdx] = clamp(
          data[neighborIdx] + errR * (5 / 16) * ditherFactor,
        );
        data[neighborIdx + 1] = clamp(
          data[neighborIdx + 1] + errG * (5 / 16) * ditherFactor,
        );
        data[neighborIdx + 2] = clamp(
          data[neighborIdx + 2] + errB * (5 / 16) * ditherFactor,
        );
      }

      // 4) (x+1, y+1)
      neighborIdx = ((y + 1) * width + (x + 1)) * 4;
      if (x + 1 < width && y + 1 < height) {
        data[neighborIdx] = clamp(
          data[neighborIdx] + errR * (1 / 16) * ditherFactor,
        );
        data[neighborIdx + 1] = clamp(
          data[neighborIdx + 1] + errG * (1 / 16) * ditherFactor,
        );
        data[neighborIdx + 2] = clamp(
          data[neighborIdx + 2] + errB * (1 / 16) * ditherFactor,
        );
      }
    }
  }
};
