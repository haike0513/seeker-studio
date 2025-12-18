import { useData } from "vike-solid/useData";
import type { Data } from "./+data";

export default function Head() {
  const { news } = useData<Data>();
  return (
    <>
      <title>{news?.title || "新闻详情"}</title>
    </>
  );
}

