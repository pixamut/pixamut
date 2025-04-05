import { memo, useEffect, useState } from "react";
import "./PixelDetails.scss";
import { useAppSelector } from "$store/hooks";
import { IonButton, IonIcon, IonLabel, useIonModal } from "@ionic/react";
import { chevronBackSharp, chevronForwardSharp } from "ionicons/icons";
import {
  selectControlOfOwner,
  selectPixelById,
  selectTVL,
} from "$features/pixels/pixel.slice";
import { colorToString, shortenAddress } from "$features/shared/utils";
import ActivityChart from "./ActivityChart/ActivityChart";
import StakeModal from "$features/pixels/modals/StakeModal/StakeModal";
import { PIXEL_IDS } from "$features/pixels/pixels.utils";
import { selectPixelEventsOfPixel } from "$features/pixels/pixelEvents.slice";
import PixelHistory from "./PixelHistory";

type Props = {};
const PixelDetails: React.FC<Props> = ({}) => {
  const selectedPixelId = useAppSelector((state) => state.pixels.selectedPixel);
  const tvl = useAppSelector(selectTVL);
  const pixel = useAppSelector((state) =>
    selectPixelById(state, selectedPixelId ?? -1),
  );
  const controls = useAppSelector((state) =>
    selectControlOfOwner(state, pixel?.owner!),
  );

  const [isLeftOpen, setIsLeftOpen] = useState<boolean>(true);
  const [isRightOpen, setIsRightOpen] = useState<boolean>(true);

  function toggleIsLeftOpen() {
    setIsLeftOpen((previous) => !previous);
  }
  function toggleIsRightOpen() {
    setIsRightOpen((previous) => !previous);
  }

  return (
    <>
      {pixel && (
        <div className="pixel-details-container">
          <div className="pixel-details-center-container">
            <div className="pixel-details-header">
              <div
                className="pixel"
                style={
                  {
                    "--color": colorToString(pixel.color!),
                  } as any
                }
              />
              <div className="name">
                pixel#<span>{pixel.id}</span>
              </div>
              <div className="coords">
                ({pixel.x},{pixel.y})
              </div>
            </div>
            <div className="pixel-details-content">
              <div className="left-button">
                <IonButton onClick={toggleIsLeftOpen}>
                  <IonIcon icon={chevronBackSharp} slot="icon-only" />
                </IonButton>
              </div>
              <div className="content-slide center">
                <div className="section">
                  {/* <div className="title">summary</div> */}
                  <div className="content">
                    <div className="info">
                      <div className="info-title">owner</div>
                      <div className="info-separator">:</div>
                      <div className="info-value">
                        {shortenAddress(pixel.owner)}
                      </div>
                    </div>
                    <div className="info">
                      <div className="info-title">staked</div>
                      <div className="info-separator">:</div>
                      <div className="info-value">
                        {pixel.stakeAmount!.toFixed(2)}{" "}
                        <div className="unit">IFYS</div>
                      </div>
                    </div>
                    <div className="info">
                      <div className="info-title">share</div>
                      <div className="info-separator">:</div>
                      <div className="info-value">
                        {tvl
                          ? ((pixel.stakeAmount! * 100) / tvl).toFixed(2)
                          : 0}
                        <div className="unit">%</div>
                      </div>
                    </div>
                  </div>
                  <IonButton id="open-stake-modal">
                    <IonLabel>stake</IonLabel>
                  </IonButton>
                  <StakeModal pixelId={selectedPixelId!} />
                </div>
              </div>
              <div className={`content-slide left ${isLeftOpen ? "open" : ""}`}>
                <div className="section">
                  <div className="title">owner</div>
                  <div className="content">
                    <div className="info">
                      <div className="info-title">tx</div>
                      <div className="info-separator">:</div>
                      <div className="info-value">
                        {shortenAddress(pixel.hash)}
                      </div>
                    </div>

                    <div className="info">
                      <div className="info-title">controls</div>
                      <div className="info-separator">:</div>
                      <div className="info-value">
                        {controls}
                        <div className="unit">px</div>
                        <div className="additional-info">
                          ({((controls * 100) / PIXEL_IDS.length).toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="section history">
                  <div className="title">history</div>
                  <div className="content">
                    <div className="color-blocks">
                      <PixelHistory pixelId={selectedPixelId || 0} />
                    </div>
                  </div>
                </div>
              </div>
              <div
                className={`content-slide right ${isRightOpen ? "open" : ""}`}
              >
                <div className="section">
                  <div className="title">activity</div>
                  <div className="content">
                    <ActivityChart pixelId={selectedPixelId!} />
                  </div>
                </div>
              </div>
              <div className="right-button">
                <IonButton onClick={toggleIsRightOpen}>
                  <IonIcon icon={chevronForwardSharp} slot="icon-only" />
                </IonButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default memo(PixelDetails);
