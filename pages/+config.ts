import type { Config } from "vike/types";
import vikePhoton from "vike-photon/config";
import vikeSolid from "vike-solid/config";
import vikeSolidQuery from "vike-solid-query/config";

// Default config (can be overridden by pages)
// https://vike.dev/config

export default {
  // https://vike.dev/head-tags
  title: "Seeker Studio",
  description: "智能工作流编辑器 - Seeker Studio",

  extends: [vikeSolid, vikeSolidQuery, vikePhoton],

  // https://vike.dev/vike-photon
  photon: {
    server: "../server/entry.ts",
  },

  // https://vike.dev/auth
  // 将 pageContext.user 传递到客户端
  passToClient: ["user"],
} satisfies Config;
