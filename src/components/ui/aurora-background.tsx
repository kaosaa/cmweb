"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <div
      className={cn(
        "transition-bg relative flex h-full w-full flex-col",
        "bg-gradient-to-br from-slate-50 via-white to-blue-50/30",
        "dark:bg-none dark:bg-black",
        className,
      )}
      {...props}
    >
      {/* 浅色模式极光 - 只在浅色模式显示 */}
      <div className="absolute inset-0 overflow-hidden dark:hidden pointer-events-none">
        <div
          className="absolute -inset-[10px] opacity-40 blur-[80px] will-change-transform"
          style={{
            background: `
              repeating-linear-gradient(100deg,
                rgba(255, 182, 193, 0.3) 0%,
                rgba(230, 190, 255, 0.35) 15%,
                rgba(173, 216, 230, 0.3) 30%,
                rgba(152, 251, 152, 0.25) 45%,
                rgba(255, 218, 185, 0.3) 60%,
                rgba(255, 182, 193, 0.3) 100%
              )
            `,
            backgroundSize: "200% 100%",
            backgroundPosition: "50% 50%",
            animation: "aurora 60s linear infinite",
          }}
        />
        <div
          className="absolute -inset-[10px] opacity-30 blur-[100px] will-change-transform"
          style={{
            background: `
              radial-gradient(ellipse at 20% 30%, rgba(167, 139, 250, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, rgba(253, 164, 175, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 40% 70%, rgba(134, 239, 172, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 90% 80%, rgba(252, 211, 77, 0.12) 0%, transparent 50%)
            `,
            animation: "aurora 90s ease-in-out infinite alternate",
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `
              repeating-linear-gradient(90deg,
                rgba(255, 182, 193, 0.05) 0px,
                transparent 40px,
                transparent 80px,
                rgba(230, 190, 255, 0.05) 120px
              )
            `,
          }}
        />
      </div>

      {/* 深色模式极光 - 只在深色模式显示 - 100%原始仓库代码 */}
      <div
        className="hidden dark:block absolute inset-0 overflow-hidden"
        style={
          {
            "--aurora":
              "repeating-linear-gradient(100deg,#3b82f6_10%,#a5b4fc_15%,#93c5fd_20%,#ddd6fe_25%,#60a5fa_30%)",
            "--dark-gradient":
              "repeating-linear-gradient(100deg,#000_0%,#000_7%,transparent_10%,transparent_12%,#000_16%)",
            "--white-gradient":
              "repeating-linear-gradient(100deg,#fff_0%,#fff_7%,transparent_10%,transparent_12%,#fff_16%)",

            "--blue-300": "#93c5fd",
            "--blue-400": "#60a5fa",
            "--blue-500": "#3b82f6",
            "--indigo-300": "#a5b4fc",
            "--violet-200": "#ddd6fe",
            "--black": "#000",
            "--white": "#fff",
            "--transparent": "transparent",
          } as React.CSSProperties
        }
      >
        <div
          className={cn(
            `after:animate-aurora pointer-events-none absolute -inset-[10px] [background-image:var(--white-gradient),var(--aurora)] [background-size:300%,_200%] [background-position:50%_50%,50%_50%] opacity-20 blur-[40px] invert filter will-change-transform [--aurora:repeating-linear-gradient(100deg,var(--blue-500)_10%,var(--indigo-300)_15%,var(--blue-300)_20%,var(--violet-200)_25%,var(--blue-400)_30%)] [--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--black)_16%)] [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] after:[background-size:200%,_100%] after:[background-attachment:fixed] after:mix-blend-difference after:content-[""] dark:[background-image:var(--dark-gradient),var(--aurora)] dark:invert-0 after:dark:[background-image:var(--dark-gradient),var(--aurora)]`,

            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]`,
          )}
        ></div>
      </div>
      {children}
    </div>
  );
};
