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
        // 浅色模式：柔和渐变
        "bg-gradient-to-br from-slate-50 via-white to-blue-50/30",
        // 深色模式：纯黑深邃底色
        "dark:bg-none dark:bg-[#050507]",
        className,
      )}
      {...props}
    >
      {/* ── 浅色模式极光（保持不变） ── */}
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

      {/* ── 深色模式：深邃暗色背景 ── */}
      <div className="hidden dark:block absolute inset-0 overflow-hidden pointer-events-none">
        {/* 底层：深黑径向渐变，营造深渊般的纵深 */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% 0%, rgba(8, 8, 18, 1) 0%, transparent 65%),
              radial-gradient(ellipse 70% 45% at 100% 100%, rgba(5, 5, 14, 0.9) 0%, transparent 55%),
              radial-gradient(ellipse 50% 40% at 0% 80%, rgba(6, 4, 16, 0.7) 0%, transparent 45%)
            `,
          }}
        />

        {/* 中层：极暗的色彩光晕，仅隐约可见 */}
        <div
          className="absolute -inset-[20px] opacity-[0.04] blur-[140px]"
          style={{
            background: `
              radial-gradient(ellipse at 10% 15%, #4338ca 0%, transparent 50%),
              radial-gradient(ellipse at 90% 20%, #6d28d9 0%, transparent 45%),
              radial-gradient(ellipse at 45% 85%, #1e3a5f 0%, transparent 50%)
            `,
          }}
        />

        {/* 上层：极微弱的顶部边缘光 */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            background: `
              linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 8%),
              linear-gradient(0deg, rgba(255,255,255,0.01) 0%, transparent 5%)
            `,
          }}
        />

        {/* 纹理层：几乎不可见的噪点，增加质感 */}
        <div
          className="absolute inset-0 opacity-[0.008]"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 50%, white 0.5px, transparent 0.5px),
              radial-gradient(circle at 80% 30%, white 0.5px, transparent 0.5px),
              radial-gradient(circle at 50% 70%, white 0.5px, transparent 0.5px),
              radial-gradient(circle at 35% 15%, white 0.5px, transparent 0.5px),
              radial-gradient(circle at 65% 85%, white 0.5px, transparent 0.5px)
            `,
            backgroundSize: "200px 200px, 150px 180px, 180px 160px, 160px 200px, 170px 190px",
          }}
        />
      </div>

      {children}
    </div>
  );
};
