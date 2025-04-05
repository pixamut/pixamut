import { memo } from "react";

import { IonButton, IonIcon, IonMenuToggle } from "@ionic/react";
import { menuSharp } from "ionicons/icons";

import "./SmallEndMenu.scss";
import { useMenuContext } from "./useMenuContext";
import SmallProjectsList from "$features/projects/ProjectsList/SmallProjectsList/SmallProjectsList";

type Props = {
  menuId: string;
  contentId: string;
};
const SmallEndMenu: React.FC<Props> = ({ menuId, contentId }) => {
  const { rightMenuOpen, toggleRightMenu } = useMenuContext();

  return (
    <>
      {!rightMenuOpen && (
        <div className="small-end-menu-container">
          <IonMenuToggle autoHide={false} menu={menuId}>
            <IonButton fill="clear" onClick={() => toggleRightMenu()}>
              <IonIcon slot="icon-only" icon={menuSharp} />
            </IonButton>
          </IonMenuToggle>
          <div className="small-end-menu-content">
            <SmallProjectsList />
          </div>
        </div>
      )}
    </>
  );
};

export default memo(SmallEndMenu);
