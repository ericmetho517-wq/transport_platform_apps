import config from "./app.config.json";
import { App } from "./App";
import type { TransportApp } from "../../../shared/project-runtime";

App(config as TransportApp);
