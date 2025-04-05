import { useAppDispatch, useAppSelector } from "$store/hooks";
import { Container, Graphics } from "pixi.js";
import { memo, useEffect, useRef } from "react";
import {
  selectPixelById,
  setSelectedPixel,
} from "$features/pixels/pixel.slice";
import { IPixel } from "$features/pixels/pixel.interface";
import {
  BASE_PIXEL_SIZE,
  BORDER_SIZE,
} from "$features/pixels/map/MapDisplay/utils";

type GraphicsWithData = Graphics & {
  customData: any;
};

function drawPx(
  px: GraphicsWithData,
  color: number,
  x: number,
  y: number,
): void {
  px.clear();
  px.rect(
    x * BASE_PIXEL_SIZE,
    y * BASE_PIXEL_SIZE,
    BASE_PIXEL_SIZE,
    BASE_PIXEL_SIZE,
  ).fill({ color: color });
}

type Props = { id: number; layer: Container };
const ProjectPixelDisplay: React.FC<Props> = ({ id, layer }) => {
  const dispatch = useAppDispatch();
  const pixel = useAppSelector((state) => selectPixelById(state, id));

  const pixelRef = useRef<IPixel>(pixel);
  const pxRef = useRef<GraphicsWithData | null>(null);

  useEffect(() => {
    if (pxRef.current || !layer) return;
    const px = new Graphics() as GraphicsWithData;

    pxRef.current = px;
    layer.addChild(px);
    return () => {
      layer.removeChild(px);
      px.destroy();
      pxRef.current = null;
    };
  }, [layer]);

  useEffect(() => {
    if (pixelRef.current !== pixel) {
      pixelRef.current = pixel;
    }
    if (pxRef.current) {
      drawPx(
        pxRef.current,
        pixel.color ? pixel.color : 0x000000, // Assuming 0x000000 as the default color if not specified
        pixel.x,
        pixel.y,
      );
    }
  }, [pixel]);
  return null;
};

export default memo(ProjectPixelDisplay);
