import { useAppDispatch, useAppSelector } from "$store/hooks";
import { Container, Graphics } from "pixi.js";
import { memo, useEffect, useRef } from "react";
import { BASE_PIXEL_SIZE, BORDER_SIZE } from "../MapDisplay/utils";
import {
  selectPixelById,
  setSelectedPixel,
} from "$features/pixels/pixel.slice";
import { IPixel } from "$features/pixels/pixel.interface";

type GraphicsWithData = Graphics & {
  customData: any;
};

const DEFAULT_COLOR = 0x000000; // Default black color

function drawPx(
  px: GraphicsWithData,
  color: number,
  x: number,
  y: number,
  isHovered: boolean = false,
): void {
  px.clear();
  const { isSelected } = px.customData;
  if (isSelected) {
    px.rect(
      x * BASE_PIXEL_SIZE,
      y * BASE_PIXEL_SIZE,
      BASE_PIXEL_SIZE,
      BASE_PIXEL_SIZE,
    ).fill({ color: 0xe2b714 });
    px.rect(
      x * BASE_PIXEL_SIZE + BORDER_SIZE,
      y * BASE_PIXEL_SIZE + BORDER_SIZE,
      BASE_PIXEL_SIZE - BORDER_SIZE * 2,
      BASE_PIXEL_SIZE - BORDER_SIZE * 2,
    ).fill({ color: color });
  } else if (isHovered) {
    px.rect(
      x * BASE_PIXEL_SIZE,
      y * BASE_PIXEL_SIZE,
      BASE_PIXEL_SIZE,
      BASE_PIXEL_SIZE,
    ).fill({ color: 0x2c2e31 });
    px.rect(
      x * BASE_PIXEL_SIZE + BORDER_SIZE,
      y * BASE_PIXEL_SIZE + BORDER_SIZE,
      BASE_PIXEL_SIZE - BORDER_SIZE * 2,
      BASE_PIXEL_SIZE - BORDER_SIZE * 2,
    ).fill({ color: color });
  } else {
    px.rect(
      x * BASE_PIXEL_SIZE,
      y * BASE_PIXEL_SIZE,
      BASE_PIXEL_SIZE,
      BASE_PIXEL_SIZE,
    ).fill({ color: color });
  }
}

type Props = { id: number; layer: Container };
const PixelDisplay: React.FC<Props> = ({ id, layer }) => {
  const dispatch = useAppDispatch();
  const pixel = useAppSelector((state) => selectPixelById(state, id));
  const isSelected = useAppSelector(
    (state) => state.pixels.selectedPixel == id,
  );

  const pixelRef = useRef<IPixel>(pixel);
  const pxRef = useRef<GraphicsWithData | null>(null);

  useEffect(() => {
    if (pxRef.current || !layer) return;
    const px = new Graphics() as GraphicsWithData;

    px.customData = {};

    px.eventMode = "static";
    px.cursor = "pointer";

    px.on("click", (e) => {
      e.stopPropagation();
      dispatch(setSelectedPixel(pixelRef.current.id));
    });


    px.on("touchstart", (e) => {
      e.stopPropagation();
      dispatch(setSelectedPixel(pixelRef.current.id));
    });

    px.on("pointerover", () => {
      drawPx(
        px,
        pixelRef.current.color ?? DEFAULT_COLOR,
        pixelRef.current.x,
        pixelRef.current.y,
        true,
      );
    });

    px.on("pointerout", () => {
      drawPx(
        px,
        pixelRef.current.color ?? DEFAULT_COLOR,
        pixelRef.current.x,
        pixelRef.current.y,
        false,
      );
    });

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
      pxRef.current.customData.isSelected = isSelected;
      drawPx(pxRef.current, pixel.color ?? DEFAULT_COLOR, pixel.x, pixel.y);
    }
  }, [pixel, isSelected]);
  return null;
};

export default memo(PixelDisplay);
