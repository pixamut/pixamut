import { memo, useEffect, useState } from "react";
import "./PixelDetails.scss";
import { useAppSelector, useAppDispatch } from "$store/hooks";

import {
  IonButtons,
  IonButton,
  IonModal,
  IonHeader,
  IonContent,
  IonToolbar,
  IonTitle,
  IonIcon,
  IonLabel,
  IonFooter,
  IonSegment,
  IonSegmentView,
  IonSegmentContent,
  IonSegmentButton,
} from "@ionic/react";
import { closeSharp } from "ionicons/icons";
import {
  selectControlOfOwner,
  selectPixelById,
  selectTVL,
  setSelectedPixel,
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
    selectPixelById(state, selectedPixelId ?? -1)
  );
  const controls = useAppSelector((state) =>
    selectControlOfOwner(state, pixel?.owner!)
  );
  const dispatch = useAppDispatch();

  const [isLeftOpen, setIsLeftOpen] = useState<boolean>(true);
  const [isRightOpen, setIsRightOpen] = useState<boolean>(true);
  const [selectedTab, setSelectedTab] = useState<string | number>("first");

  function toggleIsLeftOpen() {
    setIsLeftOpen((previous) => !previous);
  }
  function toggleIsRightOpen() {
    setIsRightOpen((previous) => !previous);
  }

  return (
    <>
      <IonModal className={selectedTab.toString()} isOpen={!!pixel} onDidDismiss={() => dispatch(setSelectedPixel(undefined))}>
        <IonHeader>
          <IonToolbar className="header-toolbar">
            <IonButtons slot="start">
              <IonButton>
                <div
                  className="pixel"
                  style={
                    {
                      "--color": pixel
                        ? colorToString(pixel.color!)
                        : "transparent",
                    } as any
                  }
                />
              </IonButton>
            </IonButtons>
            <IonTitle>
              <div className="name">
                pixel#<span>{pixel?.id ?? 0}</span> ({pixel?.x ?? 0},
                {pixel?.y ?? 0})
              </div>
            </IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => dispatch(setSelectedPixel(undefined))}>
                <IonIcon icon={closeSharp}></IonIcon>
              </IonButton>
            </IonButtons>
          </IonToolbar>
          <IonToolbar className="segment-toolbar">
            <IonSegment
              value={selectedTab}
              onIonChange={(e) => {
                if (e.detail.value) {
                  setSelectedTab(e.detail.value);
                }
              }}
            >
              <IonSegmentButton value="first" contentId="first">
                <IonLabel>Info</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="second" contentId="second">
                <IonLabel>History</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="third" contentId="third">
                <IonLabel>Chart</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonSegmentView>
            <IonSegmentContent id="first">
              <div className="section">
                <div className="content">
                  <div className="info">
                    <div className="info-title">owner</div>
                    <div className="info-separator">:</div>
                    <div className="info-value">
                      {shortenAddress(pixel?.owner ?? "")}
                    </div>
                  </div>
                  <div className="info">
                    <div className="info-title">staked</div>
                    <div className="info-separator">:</div>
                    <div className="info-value">
                      {pixel?.stakeAmount!.toFixed(2)}{" "}
                      <div className="unit">PXMT</div>
                    </div>
                  </div>
                  <div className="info">
                    <div className="info-title">share</div>
                    <div className="info-separator">:</div>
                    <div className="info-value">
                      {tvl ? ((pixel?.stakeAmount! * 100) / tvl).toFixed(2) : 0}
                      <div className="unit">%</div>
                    </div>
                  </div>
                </div>
              </div>
            </IonSegmentContent>
            <IonSegmentContent id="second">
              <div className="section">
                <div className="title">owner</div>
                <div className="content">
                  <div className="info">
                    <div className="info-title">tx</div>
                    <div className="info-separator">:</div>
                    <div className="info-value">
                      {shortenAddress(pixel?.hash ?? "")}
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
            </IonSegmentContent>
            <IonSegmentContent id="third">
              {selectedPixelId && <ActivityChart pixelId={selectedPixelId!} />}
            </IonSegmentContent>
          </IonSegmentView>
        </IonContent>
        {selectedTab === "first" && (
          <IonFooter>
            <IonToolbar>
              <IonButton expand="block" id="open-stake-modal">
                <IonLabel>stake</IonLabel>
              </IonButton>
              <StakeModal pixelId={selectedPixelId!} />
            </IonToolbar>
          </IonFooter>
        )}
      </IonModal>
    </>
  );
};

export default memo(PixelDetails);
