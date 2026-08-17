import Link, { type LinkProps } from "next/link"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

// Base UI's Button primitive has no `asChild` — this wraps next/link with the
// same variant styles so pages can render "link-shaped buttons" without
// duplicating class strings at every callsite.
// ponytail: thin wrapper, no state; upgrade to a real Slot pattern if we swap Button lib.

type Props = LinkProps &
  VariantProps<typeof buttonVariants> & {
    className?: string
    children: React.ReactNode
  }

export function LinkButton({
  className,
  variant,
  size,
  children,
  ...linkProps
}: Props) {
  return (
    <Link
      {...linkProps}
      className={cn(buttonVariants({ variant, size, className }))}
    >
      {children}
    </Link>
  )
}
