import type { TransportApp } from "../../../shared/project-runtime";
import { renderPendingDataApp } from "../../../shared/data-pending-app";
export const App = (config: TransportApp) => renderPendingDataApp(config);
