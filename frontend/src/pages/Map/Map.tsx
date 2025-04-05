import { memo } from "react";
import { IonContent, IonPage } from "@ionic/react";

import MapDisplay from "$features/pixels/map/MapDisplay/MapDisplay";

import "./Map.scss";

const MapPage: React.FC = () => {
  return (
      <IonContent>
        <div className="page-main-container map-main-container">
          <MapDisplay />
      </div>
    </IonContent>
  );
};

export default memo(MapPage);
