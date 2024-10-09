import React from "react";
import { createRoot } from "react-dom/client";
import Main from "./src/Main";

const container = document.getElementById("root");
const root = createRoot(container as HTMLElement);

root.render(<Main />);
