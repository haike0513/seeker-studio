import { createSignal, Show } from "solid-js";
import { Motion } from "solid-motionone";
import { prefersReducedMotion } from "@/lib/motion-utils";

export { Counter };

function Counter() {
  const [count, setCount] = createSignal(0);
  const shouldAnimate = !prefersReducedMotion();

  const handleClick = () => {
    setCount((c) => c + 1);
  };

  return (
    <Motion.button
      type="button"
      class={
        "inline-block border border-black rounded bg-gray-200 px-2 py-1 text-xs font-medium uppercase leading-normal"
      }
      onClick={handleClick}
      whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
      transition={{ duration: 0.2, easing: "ease-out" }}
    >
      Counter{" "}
      <Show
        when={shouldAnimate}
        fallback={<span>{count()}</span>}
      >
        <Motion.span
          key={count()}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, easing: "ease-out" }}
        >
          {count()}
        </Motion.span>
      </Show>
    </Motion.button>
  );
}
