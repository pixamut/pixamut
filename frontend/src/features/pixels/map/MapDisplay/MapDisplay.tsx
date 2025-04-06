import { memo, useEffect, useRef, useState } from "react";
import { Application, Container } from "pixi.js";
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
  const [loadingState, setLoadingState] = useState<string>("idle");
  const { isDesktop } = usePlatform();
  const isMountedRef = useRef<boolean>(true);

  // Cleanup function
  const cleanup = () => {
    if (appRef.current && viewportRef.current) {
      try {
        // Stop the ticker
        if (appRef.current.ticker) {
          appRef.current.ticker.stop();
        }
        
        // Remove viewport from stage
        if (appRef.current.stage) {
          appRef.current.stage.removeChild(viewportRef.current);
        }
        
        // Destroy viewport
        viewportRef.current.destroy();
        viewportRef.current = null;
        
        // Destroy application
        appRef.current.destroy(true, true);
        appRef.current = null;
        layerRef.current = null;
      } catch (error) {
        // Silent error handling
      }
    }
    
    setIsInit(false);
    setLoadingState("idle");
  };

  useEffect(() => {
    // Mark component as mounted
    isMountedRef.current = true;
    
    // Clean up existing resources before reinitializing
    cleanup();

    // Function to initialize the application
    const initializeApp = async () => {
      // Check if container is available
      if (!containerRef.current) {
        return;
      }

      // Avoid multiple initializations
      if (appRef.current) {
        return;
      }

      setLoadingState("initializing");

      try {
        // Initialize Pixi.js application
        const app = new Application();
        appRef.current = app;
        
        await app.init({
          backgroundAlpha: 1,
          resizeTo: containerRef.current,
          resolution: window.devicePixelRatio || 1,
          antialias: true,
          backgroundColor: 0x2c2e31,
        });

        // Check if component is still mounted
        if (!isMountedRef.current) {
          app.destroy(true, true);
          return;
        }
        
        // Check if app was destroyed during initialization
        if (!appRef.current) {
          return;
        }
        
        // Check if container is still available
        if (!containerRef.current) {
          app.destroy(true, true);
          return;
        }
        
        // Add canvas to container
        containerRef.current.appendChild(app.canvas);

        const worldWidth = WIDTH * BASE_PIXEL_SIZE;
        const worldHeight = HEIGHT * BASE_PIXEL_SIZE;

        // Create viewport
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
          viewport
            .drag({
              mouseButtons: "all",
              wheel: false,
            })
            .wheel({
              smooth: 20,
            })
            .clampZoom({
              minScale: 0.1,
              maxScale: 3,
            });
        } else {
          viewport
            .drag({
              mouseButtons: "all",
              wheel: false,
            })
            .pinch({
              percent: 0.5,
              noDrag: false,
              factor: 1.2,
            })
            .wheel({
              smooth: 30,
            })
            .clampZoom({
              minScale: 0.1,
              maxScale: 3,
            });
        }

        // Adjust scale
        const widthScale = containerRef.current.clientWidth / worldWidth;
        const heightScale = containerRef.current.clientHeight / worldHeight;
        const scale = Math.min(widthScale, heightScale) * 0.45;
        const scaleX = widthScale * 0.45;
        const scaleY = heightScale * 0.45;

        viewport.setZoom(scale);
        
        // Center viewport
        const offsetX = (containerRef.current.clientWidth - (worldWidth * scaleX)) / 2.2;
        const offsetY = (containerRef.current.clientHeight - (worldHeight * scaleY)) / 2.2;
        viewport.moveCenter(
          worldWidth / 2 + offsetX / scale,
          worldHeight / 2 + offsetY / scale
        );

        // Create layer
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
        
        // Check if component is still mounted
        if (!isMountedRef.current) {
          cleanup();
          return;
        }
        
        setLoadingState("ready");
        setIsInit(true);
      } catch (error) {
        setLoadingState("error");
      }
    };

    // Wait a short delay to ensure container is available
    const initTimeout = setTimeout(() => {
      if (isMountedRef.current) {
        initializeApp();
      }
    }, 100);

    // Handle resize
    const handleResize = () => {
      if (containerRef.current && viewportRef.current) {
        viewportRef.current.screenWidth = containerRef.current.clientWidth;
        viewportRef.current.screenHeight = containerRef.current.clientHeight;
        
        const worldWidth = WIDTH * BASE_PIXEL_SIZE;
        const worldHeight = HEIGHT * BASE_PIXEL_SIZE;
        const newWidthScale = containerRef.current.clientWidth / worldWidth;
        const newHeightScale = containerRef.current.clientHeight / worldHeight;
        const newScale = newWidthScale * 0.45;
        
        viewportRef.current.setZoom(newScale);
        
        const newOffsetX = (containerRef.current.clientWidth - (worldWidth * newScale)) / 2.2;
        const newOffsetY = (containerRef.current.clientHeight - (worldHeight * newScale)) / 2.2;
        viewportRef.current.moveCenter(
          worldWidth / 2 + newOffsetX / newScale,
          worldHeight / 2 + newOffsetY / newScale
        );
      }
    };

    window.addEventListener("resize", handleResize);

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      clearTimeout(initTimeout);
      window.removeEventListener("resize", handleResize);
      cleanup();
    };
  }, [isDesktop, dispatch]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {loadingState === "ready" && isInit && layerRef.current && (
        <>
          {PIXEL_IDS.map((id) => (
            <PixelDisplay key={id} id={id} layer={layerRef.current!} />
          ))}
          <GridDisplay layer={layerRef.current!} />
        </>
      )}
      {loadingState === "error" && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "red" }}>
          Error loading map
        </div>
      )}
      {loadingState === "initializing" && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "white" }}>
          Loading map...
        </div>
      )}
      <PixelDetails />
    </div>
  );
};

export default memo(MapDisplay);
