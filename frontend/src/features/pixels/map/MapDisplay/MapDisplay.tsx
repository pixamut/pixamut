import { memo, useEffect, useRef, useState } from "react";
import { Application, Container, Graphics, Point } from "pixi.js";
import { Viewport } from "pixi-viewport";
import "./MapDisplay.scss";
import { BASE_PIXEL_SIZE } from "./utils";
import PixelDisplay from "../PixelDisplay/PixelDisplay";
import GridDisplay from "../GridDisplay/GridDisplay";
import PixelDetails from "../PixelDetails/PixelDetails";
import { useAppDispatch, usePlatform } from "$store/hooks";
import { HEIGHT, PIXEL_IDS, WIDTH } from "$features/pixels/pixels.utils";
import { setSelectedPixel } from "$features/pixels/pixel.slice";

type Props = {};
const MapDisplay: React.FC<Props> = () => {
  const dispatch = useAppDispatch();
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const viewportRef = useRef<Viewport | null>(null);
  const layerRef = useRef<Container | null>(null);
  const [isInit, setIsInit] = useState<boolean>(false);
  const { isDesktop } = usePlatform();

  useEffect(() => {
    async function initApp() {
      if (!containerRef.current || appRef.current) return;

      const app = new Application();
      appRef.current = app;
      await app.init({
        backgroundAlpha: 1,
        resizeTo: containerRef.current,
        resolution: window.devicePixelRatio || 1,
        antialias: true,
        backgroundColor: 0x2c2e31,
      });

      containerRef.current.appendChild(app.canvas);

      const worldWidth = WIDTH * BASE_PIXEL_SIZE;
      const worldHeight = HEIGHT * BASE_PIXEL_SIZE;

      const viewport = new Viewport({
        screenWidth: containerRef.current.clientWidth,
        screenHeight: containerRef.current.clientHeight,
        worldWidth,
        worldHeight,
        events: app.renderer.events,
        disableOnContextMenu: true,
        ticker: app.ticker,
        noTicker: false,
      });

      viewport.eventMode = "static";
      viewport.sortableChildren = true;

      // Configure viewport based on platform
      if (isDesktop) {
        // Desktop configuration
        viewport
          .drag({
            mouseButtons: "all",
            wheel: false,
          })
          .wheel({
            smooth: 10,
            center: new Point(0, 0),
          })
          .clampZoom({
            minScale: 0.1,
            maxScale: 3,
          });
      } else {
        // Mobile configuration
        viewport
          .drag({
            mouseButtons: "all",
            wheel: false,
          })
          .pinch({
            percent: 0.5,
            noDrag: false,
            factor: 1.5,
          })
          .wheel({
            smooth: 10,
            center: new Point(0, 0),
          })
          .clampZoom({
            minScale: 0.1,
            maxScale: 3,
          });
      }

      // Adjust scale calculation to better handle mobile screens
      const widthScale = containerRef.current.clientWidth / worldWidth;
      const heightScale = containerRef.current.clientHeight / worldHeight;
      const scale = Math.min(widthScale, heightScale) * 0.45;
      const scaleX = widthScale * 0.45;
      const scaleY = heightScale * 0.45;

      viewport.setZoom(scale);
      
      // Center the viewport with offset to account for the container size
      const offsetX = (containerRef.current.clientWidth - (worldWidth * scaleX)) / 2.2;
      const offsetY = (containerRef.current.clientHeight - (worldHeight * scaleY)) / 2.2;
      viewport.moveCenter(
        worldWidth / 2 + offsetX / scale,
        worldHeight / 2 + offsetY / scale
      );

      const layer = new Container();
      layer.eventMode = "static";
      layer.cursor = "pointer";
      viewport.on("click", () => {
        dispatch(setSelectedPixel(undefined));
      });

      viewport.addChild(layer);

      viewportRef.current = viewport;
      layerRef.current = layer;
      app.stage.addChild(viewport);
      app.ticker.minFPS = 0;
      app.ticker.start();
      setIsInit(true);

      const handleResize = () => {
        if (containerRef.current && viewport) {
          viewport.screenWidth = containerRef.current.clientWidth;
          viewport.screenHeight = containerRef.current.clientHeight;
          // Recalculate scale on resize
          const newWidthScale = containerRef.current.clientWidth / worldWidth;
          const newHeightScale = containerRef.current.clientHeight / worldHeight;
          const newScale = newWidthScale * 0.45;
          
          viewport.setZoom(newScale);
          // Recenter the viewport with offset
          const newOffsetX = (containerRef.current.clientWidth - (worldWidth * newScale)) / 2.2;
          const newOffsetY = (containerRef.current.clientHeight - (worldHeight * newScale)) / 2.2;
          viewport.moveCenter(
            worldWidth / 2 + newOffsetX / newScale,
            worldHeight / 2 + newOffsetY / newScale
          );
        }
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }

    initApp();

    return () => {
      if (appRef.current && viewportRef.current) {
        appRef.current.destroy(true, true);
        appRef.current = null;
        viewportRef.current = null;
        layerRef.current = null;
      }
    };
  }, [isDesktop]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {isInit && (
        <>
          {PIXEL_IDS.map((id) => (
            <PixelDisplay key={id} id={id} layer={layerRef.current!} />
          ))}
          <GridDisplay layer={layerRef.current!} />
        </>
      )}
      <PixelDetails />
    </div>
  );
};

export default memo(MapDisplay);
