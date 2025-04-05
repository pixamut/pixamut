import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type MenuContextProps = {
  rightMenuOpen: boolean;
  toggleRightMenu: (open?: boolean) => void;
};

const MIN_WIDTH_TO_CLOSE = 1115;
const MIN_WIDTH_TO_OPEN_BOTH = 1400;

const MenuContext = createContext<MenuContextProps>({
  rightMenuOpen: true,
  toggleRightMenu: () => {},
});

type Props = {
  children: ReactNode;
};

export const MenuProvider: React.FC<Props> = ({ children }) => {
  const [rightMenuOpen, setRightMenuOpen] = useState<boolean>(true);
  useEffect(() => {
    function onWindowResize() {
      setRightMenuOpen(window.innerWidth >= 1200);
    }
    window.addEventListener("resize", onWindowResize);
    onWindowResize();
    return () => window.removeEventListener("resize", onWindowResize);
  }, []);

  function toggleRightMenu(open?: boolean) {
    let openRight = open === undefined ? !rightMenuOpen : open;
    if (window.matchMedia("(min-width: 992px").matches) {
      const splitPane = document.querySelector(
        `ion-split-pane[content-id=main-content]`,
      );
      splitPane?.classList.toggle("split-pane-visible");
    }
    setRightMenuOpen(openRight);
  }

  return (
    <MenuContext.Provider value={{ rightMenuOpen, toggleRightMenu }}>
      {children}
    </MenuContext.Provider>
  );
};

export function useMenuContext() {
  return useContext(MenuContext);
}
