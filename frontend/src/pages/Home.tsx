import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonMenu,
  IonMenuToggle,
  IonPage,
  IonRouterOutlet,
  IonSplitPane,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonTitle,
  IonToolbar,
} from "@ionic/react";

import { accessibilitySharp, mapSharp, menuSharp } from "ionicons/icons";

import { Redirect, Route } from "react-router";
import { ToastContainer } from "react-toastify";

import MapPage from "./Map/Map";
import ProjectsPage from "./Projects/Projects";
import CommentatorPage from "./Commentator/Commentator";

import WatchEvents from "$features/shared/WatchEvents/WatchEvents";
import { useEffect } from "react";
import { fetchPixels } from "$features/pixels/pixel.slice";
import { useAppDispatch } from "$store/hooks";
import { fetchProjects } from "$features/projects/project.slice";

import "./Home.scss";
import EndMenu from "$features/shared/EndMenu/EndMenu";
// import SmallEndMenu from "$features/shared/EndMenu/SmallEndMenu";
import { MenuProvider } from "$features/shared/EndMenu/useMenuContext";

const contentId = "main-content";
const menuId = "end-menu";

const Home: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchPixels());
    dispatch(fetchProjects());
  }, []);

  return (
    <MenuProvider>
      <IonSplitPane contentId={contentId} when="xl">
        <EndMenu contentId={contentId} menuId={menuId} />
        <IonContent fullscreen id={contentId}>
          {/* <SmallEndMenu menuId={menuId} contentId={contentId} /> */}
          <IonTabs>
            <IonRouterOutlet>
              {/*@ts-ignore*/}
              <Redirect exact path="/" to="/map" />
              {/*@ts-ignore*/}
              <Route path="/map" component={MapPage} />
              {/*@ts-ignore*/}
              <Route path="/projects" component={ProjectsPage} />
              {/*@ts-ignore*/}
              <Route path="/commentator" component={CommentatorPage} />
            </IonRouterOutlet>
            <IonTabBar slot="bottom">
              <IonTabButton tab="map" href="/map">
                <IonIcon icon={mapSharp} />
                <IonLabel>map</IonLabel>
              </IonTabButton>
              {/* <IonTabButton tab="projects" href="/projects">
                <IonIcon icon={mapSharp} />
                <IonLabel>ai projects</IonLabel>
              </IonTabButton> */}
              <IonTabButton tab="commentator" href="/commentator">
                <IonIcon icon={accessibilitySharp} />
                <IonLabel>ai commentator</IonLabel>
              </IonTabButton>
            </IonTabBar>
          </IonTabs>
          <ToastContainer
            position="bottom-center"
            autoClose={5000}
            theme="dark"
          />
          <WatchEvents />
        </IonContent>
      </IonSplitPane>
    </MenuProvider>
  );
};

export default Home;
