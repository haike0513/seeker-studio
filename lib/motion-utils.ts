/**
 * 动画工具函数和预设配置
 * 提供常用的动画配置，方便在项目中复用
 */

import type { TransitionConfig } from "solid-motionone";

/**
 * 检查用户是否偏好减少动画
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * 页面过渡动画配置
 */
export const pageTransition: TransitionConfig = {
  duration: 0.3,
  easing: [0.4, 0, 0.2, 1],
};

/**
 * 页面进入动画
 */
export const pageEnter = {
  opacity: [0, 1],
  y: [20, 0],
  transition: pageTransition,
};

/**
 * 页面退出动画
 */
export const pageExit = {
  opacity: [1, 0],
  y: [0, -10],
  transition: {
    ...pageTransition,
    duration: 0.2,
  },
};

/**
 * 页面后退动画
 */
export const pageBackExit = {
  opacity: [1, 0],
  x: [0, 20],
  transition: {
    ...pageTransition,
    duration: 0.2,
  },
};

/**
 * 页面前进进入动画
 */
export const pageForwardEnter = {
  opacity: [0, 1],
  x: [-20, 0],
  transition: pageTransition,
};

/**
 * 列表项进入动画
 */
export const listItemEnter = {
  opacity: [0, 1],
  y: [20, 0],
};

/**
 * 列表项交错动画配置
 */
export const staggerConfig = {
  delay: (index: number) => index * 0.05, // 每个项目延迟 50ms
  startDelay: 0.1, // 初始延迟 100ms
};

/**
 * 按钮点击动画
 */
export const buttonClick = {
  scale: [1, 0.95, 1],
  transition: {
    duration: 0.2,
    easing: "ease-out",
  },
};

/**
 * 卡片悬停动画
 */
export const cardHover = {
  y: [0, -4],
  transition: {
    duration: 0.2,
    easing: "ease-out",
  },
};

/**
 * 淡入动画
 */
export const fadeIn = {
  opacity: [0, 1],
  transition: {
    duration: 0.3,
    easing: "ease-out",
  },
};

/**
 * 缩放进入动画
 */
export const scaleIn = {
  opacity: [0, 1],
  scale: [0.95, 1],
  transition: {
    duration: 0.2,
    easing: "ease-out",
  },
};

/**
 * 根据用户偏好返回动画配置
 * 如果用户偏好减少动画，返回简化的配置或空对象
 */
export function getTransitionConfig(config: TransitionConfig): TransitionConfig {
  if (prefersReducedMotion()) {
    return {
      ...config,
      duration: Math.min((config.duration || 0.3) * 0.5, 0.15),
    };
  }
  return config;
}
