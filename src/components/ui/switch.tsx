import type { ComponentProps } from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

type SwitchProps = ComponentProps<typeof SwitchPrimitive.Root>;

export function Switch({ className, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      className="relative h-11 w-20 shrink-0 rounded-full border border-border bg-surface-2 transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none data-[state=checked]:bg-accent"
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-8 translate-x-1.5 rounded-full bg-fg transition-transform data-[state=checked]:translate-x-10 data-[state=checked]:bg-accent-fg" />
    </SwitchPrimitive.Root>
  );
}
