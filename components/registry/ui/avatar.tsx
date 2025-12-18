import type { ComponentProps, ValidComponent } from "solid-js";
import { Show, splitProps } from "solid-js";
import { Polymorphic } from "@kobalte/core";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import { cx } from "@/registry/lib/cva";

export type AvatarProps<T extends ValidComponent = "div"> = PolymorphicProps<T>;

export const Avatar = <T extends ValidComponent = "div">(props: AvatarProps<T>) => {
  const [, rest] = splitProps(props as AvatarProps, ["class"]);

  return (
    <Polymorphic
      as="div"
      data-slot="avatar"
      class={cx(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        props.class,
      )}
      {...rest}
    />
  );
};

export type AvatarImageProps<T extends ValidComponent = "img"> = ComponentProps<"img">;

export const AvatarImage = <T extends ValidComponent = "img">(
  props: AvatarImageProps<T>,
) => {
  const [, rest] = splitProps(props as AvatarImageProps, ["class", "src", "alt"]);

  return (
    <Show when={props.src}>
      <img
        class={cx("aspect-square h-full w-full", props.class)}
        src={props.src}
        alt={props.alt}
        {...rest}
      />
    </Show>
  );
};

export type AvatarFallbackProps<T extends ValidComponent = "div"> = PolymorphicProps<T>;

export const AvatarFallback = <T extends ValidComponent = "div">(
  props: AvatarFallbackProps<T>,
) => {
  const [, rest] = splitProps(props as AvatarFallbackProps, ["class", "children"]);

  return (
    <Polymorphic
      as="div"
      data-slot="avatar-fallback"
      class={cx(
        "flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground",
        props.class,
      )}
      {...rest}
    >
      {props.children}
    </Polymorphic>
  );
};

