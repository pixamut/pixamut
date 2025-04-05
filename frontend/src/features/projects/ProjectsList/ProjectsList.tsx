import { memo } from "react";

import "./ProjectList.scss";
import { useAppSelector } from "$store/hooks";
import ProjectDisplay from "./ProjectDisplay";

const ProjectsList: React.FC = () => {
  const projects = useAppSelector((state) => state.projects.ids);
  return (
    <div className="projects-list-container">
      {projects.map((id) => (
        <ProjectDisplay key={id} projectAddress={id} />
      ))}
    </div>
  );
};

export default memo(ProjectsList);
