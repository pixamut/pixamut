import { memo } from "react";

import "./SmallProjects.scss";
import { useAppSelector } from "$store/hooks";
import SmallProjectDisplay from "./SmallProjectDisplay";
const SmallProjectsList: React.FC = () => {
  const projectIds = useAppSelector((state) => state.projects.ids);

  return (
    <div className="small-projects-container">
      {projectIds.map((id) => (
        <SmallProjectDisplay projectAddress={id} key={id} />
      ))}
    </div>
  );
};

export default memo(SmallProjectsList);
