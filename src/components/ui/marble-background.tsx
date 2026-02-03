"use client";

import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface MarbleBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
}

export const MarbleBackground = ({
  className,
  children,
  ...props
}: MarbleBackgroundProps) => {
  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col bg-black overflow-hidden",
        className,
      )}
      {...props}
    >
      {/* 大理石纹理背景 */}
      <div
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(140, 139, 218, 0.4), transparent),
            radial-gradient(ellipse 60% 50% at 80% 50%, rgba(188, 105, 255, 0.25), transparent),
            radial-gradient(ellipse 60% 50% at 20% 80%, rgba(79, 150, 255, 0.25), transparent),
            radial-gradient(ellipse 100% 100% at 50% 50%, rgba(20, 20, 30, 0.5), rgba(0, 0, 0, 0.9))
          `,
          backgroundBlendMode: "overlay",
        }}
      />

      {/* 大理石裂纹纹理 - 主要纹路 */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.18]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="marble-noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.008 0.005"
              numOctaves="6"
              seed="2"
              stitchTiles="stitch"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1
                      0 0 0 0 1
                      0 0 0 0 1
                      0 0 0 0.7 0"
            />
          </filter>
          <filter id="marble-veins">
            <feTurbulence
              type="turbulence"
              baseFrequency="0.03 0.012"
              numOctaves="4"
              seed="10"
            />
            <feDisplacementMap in="SourceGraphic" scale="120" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.95
                      0 0 0 0 0.95
                      0 0 0 0 1
                      0 0 0 0.5 0"
            />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#marble-noise)" />
        <rect width="100%" height="100%" filter="url(#marble-veins)" opacity="0.75" />
      </svg>

      {/* 细微的光泽效果 */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          background: `
            linear-gradient(120deg,
              transparent 0%,
              rgba(255, 255, 255, 0.9) 40%,
              rgba(255, 255, 255, 1) 50%,
              rgba(255, 255, 255, 0.9) 60%,
              transparent 100%
            )
          `,
          backgroundSize: "200% 100%",
          animation: "marble-shine 15s ease-in-out infinite",
        }}
      />

      {children}
    </div>
  );
};
