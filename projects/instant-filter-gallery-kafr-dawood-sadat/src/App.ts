import type { TransportApp } from "../../../shared/project-runtime";
import { renderProject } from "../../../shared/project-runtime";
export const App = (config: TransportApp) => renderProject(config);
