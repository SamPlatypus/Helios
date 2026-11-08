import type { ComponentProps } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

type SliderProps = ComponentProps<typeof SliderPrimitive.Root>;

export function Slider({ className, ...props }: SliderProps) {
  return (
    <SliderPrimitive.Root
      className={`relative flex h-11 w-full touch-none items-center select-none ${className ?? ""}`}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-surface-2">
        <SliderPrimitive.Range className="absolute h-full bg-accent" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="relative block size-8 rounded-full border border-border bg-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">
        <span className="absolute -inset-2" />
      </SliderPrimitive.Thumb>
    </SliderPrimitive.Root>
  );
}
