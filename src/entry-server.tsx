import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { MotionConfig } from "motion/react";
import { SiteRoutes } from "./App";

export function render(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const output = new PassThrough();
    let html = "";
    output.on("data", chunk => { html += chunk.toString(); });
    output.on("end", () => resolve(html));
    const stream = renderToPipeableStream(<MotionConfig reducedMotion="always"><StaticRouter location={path}><SiteRoutes /></StaticRouter></MotionConfig>, {
      onAllReady() { stream.pipe(output); },
      onError(error) { reject(error); },
      onShellError(error) { reject(error); },
    });
  });
}
