"use client";

import type * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { Sparkles } from "lucide-react";
import { Button, type buttonVariants } from "@/components/ui/button";

interface AssistantTriggerProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  label?: string;
  showIcon?: boolean;
}

export function AssistantTrigger({
  label = "Nexus AI",
  showIcon = true,
  className,
  variant = "ghost",
  size = "sm",
  ...props
}: AssistantTriggerProps) {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("open-assistant"));
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
      {...props}
    >
      {showIcon && <Sparkles className="size-4 text-primary shrink-0" />}
      {label && <span>{label}</span>}
    </Button>
  );
}
