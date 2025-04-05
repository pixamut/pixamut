import { useRef, useState } from "react";
import { floydSteinbergDither } from "./utils";
import { IonButton, IonLabel } from "@ionic/react";
import CreateProject from "../CreateProject/CreateProjectButton";

type Props = {};

const ImageProcessing: React.FC<Props> = ({}) => {
  const [originalSrc, setOriginalSrc] = useState<string | null>(null);
  const [pixelatedSrc, setPixelatedSrc] = useState<string | null>(null);

  const [targetH, setTargetH] = useState<number>(50);
  const [targetW, setTargetW] = useState<number>(50);

  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  async function handleFileChange(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      setOriginalSrc(dataUrl);
      processImage(dataUrl).then((res: string) => {
        setPixelatedSrc(res);
      });
    };
    reader.readAsDataURL(file);
  }

  async function processImage(dataUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let offCanvas = offscreenCanvasRef.current;
        if (!offCanvas) {
          offCanvas = document.createElement("canvas");
          offscreenCanvasRef.current = offCanvas;
        }
        const originalW = img.width;
        const originalH = img.height;
        offCanvas.width = originalW;
        offCanvas.height = originalH;
        const offCtx = offCanvas.getContext("2d");
        if (!offCtx) return reject("Could not create 2D context");

        offCtx.drawImage(img, 0, 0);

        const resizeCanvas = document.createElement("canvas");
        resizeCanvas.width = targetW;
        resizeCanvas.height = targetH;
        const resizeCtx = resizeCanvas.getContext("2d");
        if (!resizeCtx) return reject("Could not create 2D context (resize)");

        resizeCtx.imageSmoothingEnabled = false;
        resizeCtx.imageSmoothingQuality = "low";

        resizeCtx.drawImage(
          offCanvas,
          0,
          0,
          originalW,
          originalH,
          0,
          0,
          targetW,
          targetH,
        );
        const imageData = resizeCtx.getImageData(0, 0, targetW, targetH);

        // floydSteinbergDither(imageData, targetW, targetH, 8, 0);

        resizeCtx.putImageData(imageData, 0, 0);

        const outputDataUrl = resizeCanvas.toDataURL("image/png");
        resolve(outputDataUrl);
      };
      img.onerror = (err) => {
        reject(err);
      };
      img.src = dataUrl;
    });
  }
  return (
    <div style={{ padding: "1rem" }}>
      <h2>Pixelate & Dither Demo</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} />

      <div style={{ marginTop: "1rem" }}>
        {originalSrc && (
          <div>
            <h3>Original:</h3>
            <img
              src={originalSrc}
              alt="Original preview"
              style={{ maxWidth: 200, border: "1px solid #ccc" }}
            />
          </div>
        )}
      </div>

      <div style={{ marginTop: "1rem" }}>
        {pixelatedSrc && (
          <div>
            <h3>
              Pixelated ({targetH}×{targetW}):
            </h3>
            <img
              src={pixelatedSrc}
              alt="Pixelated result"
              style={{ maxWidth: 200, border: "1px solid #ccc" }}
            />
            <CreateProject imageUrl={pixelatedSrc} />
          </div>
        )}
      </div>

      {/* An offscreen canvas (not displayed) */}
      <canvas ref={offscreenCanvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default ImageProcessing;
