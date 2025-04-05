import { IonBackdrop, IonSpinner } from "@ionic/react";
import { memo } from "react";

import "./Loader.scss";
type Props = {
  active: boolean;
};
const Loader: React.FC<Props> = ({ active }) => {
  return (
    <>
      {active && (
        <div className="loader-container">
          <IonSpinner name="lines-sharp" color="primary" />
          <IonBackdrop visible={true} tappable={false} />
        </div>
      )}
    </>
  );
};

export default memo(Loader);
