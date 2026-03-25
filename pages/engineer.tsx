import React from "react";
import dynamic from "next/dynamic";
import CommandCenter from "../components/command-center/CommandCenter";
import ControlHUD from "../components/hud/ControlHUD";

/** Load the 3D viewport only on the client (no SSR for WebGL) */
const Viewport = dynamic(
  () => import("../components/viewport/Viewport"),
  { ssr: false }
);

export default function EngineerPage() {
  return (
    <CommandCenter headerTitle="3D Viewport — Engineering Mode">
      <Viewport />
      <ControlHUD />
    </CommandCenter>
  );
}
