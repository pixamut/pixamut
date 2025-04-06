import { Route, Switch } from "react-router-dom";
import {
  IonApp,
  IonButtons,
  IonHeader,
  IonRouterOutlet,
  IonToolbar,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import Home from "./pages/Home";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import "@ionic/react/css/palettes/dark.system.css";

/* Theme variables */
import "./theme/variables.scss";

import { Providers } from "./providers";
import UserToolbar from "$features/user/UserToolbar/UserToolbar";
import MintButton from "$features/shared/MintButton";

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <Providers>
      <IonHeader>
        <IonToolbar>
          <div id="toolbar">
            <div className="logo hide-md">
              <div id="logo-text">
                <span>Pixamut</span>
              </div>
            </div>
          </div>
          <IonButtons slot="end">
            <MintButton />
            <UserToolbar />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonReactRouter>
        <IonRouterOutlet>
          {/*@ts-ignore*/}
          <Route path="/" component={Home} />
        </IonRouterOutlet>
      </IonReactRouter>
    </Providers>
  </IonApp>
);

export default App;
