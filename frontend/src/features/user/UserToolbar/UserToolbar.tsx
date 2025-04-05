import { useAppDispatch, useAppSelector } from "$store/hooks";
import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPopover,
  useIonModal,
} from "@ionic/react";
import {
  logInSharp,
  logOutSharp,
  notificationsSharp,
  personSharp,
  settingsSharp,
  walletSharp,
} from "ionicons/icons";

import "./UserToolbar.scss";
import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { shortenAddress } from "$features/shared/utils";
import { foundry } from "viem/chains";
type Props = {};

const UserToolbar: React.FC<Props> = ({}) => {
  const dispatch = useAppDispatch();
  const history = useHistory();
  const username = useAppSelector((state) => state.user.username);
  const { switchChain } = useSwitchChain();

  const chainId = useChainId();

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const [showPopover, setShowPopover] = useState<boolean>(false);
  const [popoverEvent, setPopoverEvent] = useState<MouseEvent | undefined>();

  useEffect(() => {
    if (chainId != foundry.id) {
      switchChain({ chainId: foundry.id });
    }
  }, [chainId]);

  function handleOpenPopover(event: React.MouseEvent) {
    setPopoverEvent(event.nativeEvent);
    setShowPopover(true);
  }
  function handleClosePopover() {
    setShowPopover(false);
  }

  function handleLogin() {
    // presentLogin();
    setShowPopover(false);
  }

  function handleLogout() {
    // dispatch(logoutUser());
    setShowPopover(false);
  }

  function handleRedirect(path: string) {
    history.push(path);
    setShowPopover(false);
  }

  async function handleConnectWallet() {
    connect({ connector: connectors[0] });
    switchChain({ chainId: foundry.id });
  }
  function handleDisconnectWallet() {
    disconnect();
    window.location.reload();
  }

  return (
    <>
      <IonButton fill="clear" className="user-toolbar">
        <IonIcon slot="start" icon={notificationsSharp} />
      </IonButton>
      <IonButton
        fill="clear"
        className="user-toolbar"
        onClick={handleOpenPopover}
      >
        <IonIcon slot="start" icon={personSharp} />
        <IonLabel>
          {username || shortenAddress(address) || "local user"}
        </IonLabel>
      </IonButton>
      <IonPopover
        isOpen={showPopover}
        event={popoverEvent}
        onDidDismiss={handleClosePopover}
        showBackdrop={false}
      >
        <IonList>
          {!username && (
            <IonItem button onClick={handleLogin} lines="none">
              <IonIcon slot="start" icon={logInSharp} />
              <IonLabel>login/signup</IonLabel>
            </IonItem>
          )}
          {!isConnected && (
            <IonItem button onClick={handleConnectWallet} lines="none">
              <IonIcon slot="start" icon={walletSharp} />
              <IonLabel>connect wallet</IonLabel>
            </IonItem>
          )}
          <IonItem
            button
            onClick={() => handleRedirect("/settings")}
            lines="none"
          >
            <IonIcon slot="start" icon={settingsSharp} />
            <IonLabel>settings</IonLabel>
          </IonItem>
          {username && (
            <IonItem button onClick={handleLogout} lines="none">
              <IonIcon slot="start" icon={logOutSharp} />
              <IonLabel>logout</IonLabel>
            </IonItem>
          )}
          {isConnected && (
            <IonItem button onClick={handleDisconnectWallet} lines="none">
              <IonIcon slot="start" icon={logOutSharp} />
              <IonLabel>disconnect</IonLabel>
            </IonItem>
          )}
        </IonList>
      </IonPopover>
    </>
  );
};

export default UserToolbar;
