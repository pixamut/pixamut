import { Container, Graphics } from "pixi.js";
import { memo, useEffect, useRef } from "react";
import { BASE_PIXEL_SIZE, BORDER_SIZE } from "../MapDisplay/utils";
import { HEIGHT, WIDTH } from "$features/pixels/pixels.utils";

type Props = { layer: Container };
const GridDisplay: React.FC<Props> = ({ layer }) => {
  useEffect(() => {
    if (!layer) return;
    const grid = new Graphics();
    grid.eventMode = "none";
    for (let x = 0; x <= WIDTH; x++) {
      grid
        .moveTo(x * BASE_PIXEL_SIZE, 0)
        .lineTo(x * BASE_PIXEL_SIZE, HEIGHT * BASE_PIXEL_SIZE);
    }

    for (let y = 0; y <= HEIGHT; y++) {
      grid
        .moveTo(0, y * BASE_PIXEL_SIZE)
        .lineTo(WIDTH * BASE_PIXEL_SIZE, y * BASE_PIXEL_SIZE);
    }
    grid.stroke({ width: 2, color: 0x2c2e31 });

    layer.addChild(grid);
    return () => {
      layer.removeChild(grid);
      grid.destroy();
    };
  }, [layer]);

  return null;
};

export default memo(GridDisplay);
