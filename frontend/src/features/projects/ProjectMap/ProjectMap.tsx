import { memo, useEffect, useRef, useState } from "react";
import { Application, Container } from "pixi.js";
import { Viewport } from "pixi-viewport";
import { useAppDispatch } from "$store/hooks";
import { HEIGHT, PIXEL_IDS, WIDTH } from "$features/pixels/pixels.utils";
import ProjectPixelDisplay from "./ProjectPixelDisplay";

const width = 200;
const height = 200;

type Props = {};
import "./ProjectMap.scss";
import { BASE_PIXEL_SIZE } from "$features/pixels/map/MapDisplay/utils";
import GridDisplay from "$features/pixels/map/GridDisplay/GridDisplay";
const ProjectMap: React.FC<Props> = () => {
  const dispatch = useAppDispatch();
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const viewportRef = useRef<Viewport | null>(null);
  const layerRef = useRef<Container | null>(null);
  const [isInit, setIsInit] = useState<boolean>(false);

  useEffect(() => {
    async function initApp() {
      if (!containerRef.current || appRef.current) return;

      const app = new Application();
      appRef.current = app;
      await app.init({
        backgroundAlpha: 1,
        width: width,
        height: height,
        resolution: window.devicePixelRatio || 1,
        antialias: true,
        backgroundColor: 0x2c2e31,
      });

      containerRef.current.appendChild(app.canvas);

      const worldWidth = WIDTH * BASE_PIXEL_SIZE;
      const worldHeight = HEIGHT * BASE_PIXEL_SIZE;

      const viewport = new Viewport({
        screenWidth: width,
        screenHeight: height,
        worldWidth,
        worldHeight,
        events: app.renderer.events,
      });

      // viewport.eventMode = "static";

      viewport
        .drag()
        .pinch({
          percent: 1,
          noDrag: false,
          factor: 2,
        })
        .wheel()
        .clampZoom({
          minScale: 0.1,
          maxScale: 10,
        });

      // Adjust scale calculation to better handle mobile screens
      const widthScale = width / worldWidth;
      const heightScale = height / worldHeight;
      const scale = Math.min(widthScale, heightScale); // Add slight padding

      viewport.setZoom(scale);
      viewport.moveCenter(worldWidth / 2, worldHeight / 2);

      const layer = new Container();

      viewport.addChild(layer);

      viewportRef.current = viewport;
      layerRef.current = layer;
      app.stage.addChild(viewport);
      app.ticker.minFPS = 0;
      app.ticker.start();
      setIsInit(true);
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
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {isInit && (
        <>
          {PIXEL_IDS.map((id) => (
            <ProjectPixelDisplay key={id} id={id} layer={layerRef.current!} />
          ))}
          <GridDisplay layer={layerRef.current!} />
        </>
      )}
    </div>
  );
};

export default memo(ProjectMap);
