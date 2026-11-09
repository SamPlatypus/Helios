import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { previewPathRewrite } from "@/lib/preview-path-prefix";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const basepath = import.meta.env.BASE_URL.replace(/\/$/, "");
  return createRouter({
    routeTree,
    ...(basepath ? { basepath } : {}),
    rewrite: previewPathRewrite(),
    defaultErrorComponent: AppErrorComponent,
  });
}
