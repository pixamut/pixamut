import { memo } from "react";
import {
  IonButton,
  IonContent,
  IonIcon,
  IonLabel,
  IonMenu,
  IonMenuToggle,
} from "@ionic/react";

import Tooltip from "$features/shared/Tooltip/Tooltip";
import ProjectsList from "$features/projects/ProjectsList/ProjectsList";

import "./EndMenu.scss";
import { useMenuContext } from "./useMenuContext";
import { arrowBack, menuSharp } from "ionicons/icons";
type Props = {
  menuId: string;
  contentId: string;
};
const EndMenu: React.FC<Props> = ({ menuId, contentId }) => {
  const { toggleRightMenu } = useMenuContext();
  return (
    <IonMenu
      side="start"
      menuId={menuId}
      contentId={contentId}
      onIonWillOpen={() => toggleRightMenu(true)}
      onIonWillClose={() => toggleRightMenu(false)}
    >
      <IonContent id="end-menu-content">
        <div className="end-menu-container">
          <div className="section projects">
            <IonMenuToggle autoHide={false} menu={menuId}>
              <IonButton fill="clear" onClick={() => toggleRightMenu()}>
                <IonIcon slot="icon-only" icon={arrowBack} />
              </IonButton>
            </IonMenuToggle>
            <IonLabel className="section-title">
              <div>projects</div>
              <Tooltip text="Most funded projects" />
            </IonLabel>
            <div className="section-content">
              <ProjectsList />
            </div>
          </div>
        </div>
      </IonContent>
    </IonMenu>
  );
};

export default memo(EndMenu);
