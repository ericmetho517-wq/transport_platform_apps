import type { TransportApp } from "../../../shared/project-runtime";
import { renderProject } from "../../../shared/project-runtime";

export function App(config: TransportApp): void {
  renderProject(config);
}
