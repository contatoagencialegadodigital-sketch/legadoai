import * as React from "react";
import { cn } from "@/lib/utils";

// Lightweight stubbed sidebar components to avoid hook issues while keeping API compatibility
// This removes all React hook usage to prevent "Invalid hook call" errors

export type SidebarContext = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

export function useSidebar(): SidebarContext {
  // No hooks: return stable no-op API
  return {
    state: "expanded",
    open: true,
    setOpen: () => {},
    openMobile: false,
    setOpenMobile: () => {},
    isMobile: false,
    toggleSidebar: () => {},
  };
}

export const SidebarProvider = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("w-full", className)} {...props}>
      {children}
    </div>
  )
);
SidebarProvider.displayName = "SidebarProvider";

export const Sidebar = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("flex h-full", className)} {...props}>
      {children}
    </div>
  )
);
Sidebar.displayName = "Sidebar";

export const SidebarContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("flex-1 overflow-auto", className)} {...props}>
      {children}
    </div>
  )
);
SidebarContent.displayName = "SidebarContent";

export const SidebarGroup = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("p-2", className)} {...props}>
      {children}
    </div>
  )
);
SidebarGroup.displayName = "SidebarGroup";

export const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("", className)} {...props}>
      {children}
    </div>
  )
);
SidebarGroupContent.displayName = "SidebarGroupContent";

export const SidebarMenu = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, children, ...props }, ref) => (
    <ul ref={ref} className={cn("list-none m-0 p-0", className)} {...props}>
      {children}
    </ul>
  )
);
SidebarMenu.displayName = "SidebarMenu";

export const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  ({ className, children, ...props }, ref) => (
    <li ref={ref} className={cn("", className)} {...props}>
      {children}
    </li>
  )
);
SidebarMenuItem.displayName = "SidebarMenuItem";

export const SidebarMenuButton = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button"> & { asChild?: boolean }>(
  ({ className, children, asChild, ...props }, ref) => {
    const Comp: any = asChild ? "span" : "button";
    return (
      <Comp ref={ref} className={cn("w-full text-left", className)} {...props}>
        {children}
      </Comp>
    );
  }
);
SidebarMenuButton.displayName = "SidebarMenuButton";

export const SidebarTrigger = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  ({ className, children, ...props }, ref) => (
    <button ref={ref} className={cn("inline-flex items-center", className)} {...props}>
      {children}
    </button>
  )
);
SidebarTrigger.displayName = "SidebarTrigger";

export const SidebarRail = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("", className)} {...props}>
      {children}
    </div>
  )
);
SidebarRail.displayName = "SidebarRail";

export const SidebarSeparator = React.forwardRef<HTMLHRElement, React.ComponentProps<"hr">>(
  ({ className, ...props }, ref) => <hr ref={ref} className={cn("my-2", className)} {...props} />
);
SidebarSeparator.displayName = "SidebarSeparator";

export const SidebarInset = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("flex-1", className)} {...props}>
      {children}
    </div>
  )
);
SidebarInset.displayName = "SidebarInset";

export const SidebarInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn("h-8 w-full", className)} {...props} />
);
SidebarInput.displayName = "SidebarInput";

export const SidebarHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("p-2", className)} {...props}>
      {children}
    </div>
  )
);
SidebarHeader.displayName = "SidebarHeader";

export const SidebarFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("p-2", className)} {...props}>
      {children}
    </div>
  )
);
SidebarFooter.displayName = "SidebarFooter";

export const SidebarGroupAction = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button"> & { asChild?: boolean }>(
  ({ className, children, asChild, ...props }, ref) => {
    const Comp: any = asChild ? "span" : "button";
    return (
      <Comp ref={ref} className={cn("inline-flex items-center", className)} {...props}>
        {children}
      </Comp>
    );
  }
);
SidebarGroupAction.displayName = "SidebarGroupAction";

export const SidebarMenuSub = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, children, ...props }, ref) => (
    <ul ref={ref} className={cn("ml-4", className)} {...props}>
      {children}
    </ul>
  )
);
SidebarMenuSub.displayName = "SidebarMenuSub";

export const SidebarMenuSubItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  ({ className, children, ...props }, ref) => (
    <li ref={ref} className={cn("", className)} {...props}>
      {children}
    </li>
  )
);
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";

export const SidebarMenuSubButton = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button"> & { asChild?: boolean }>(
  ({ className, children, asChild, ...props }, ref) => {
    const Comp: any = asChild ? "span" : "button";
    return (
      <Comp ref={ref} className={cn("w-full text-left", className)} {...props}>
        {children}
      </Comp>
    );
  }
);
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";

export const SidebarMenuAction = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  ({ className, children, ...props }, ref) => (
    <button ref={ref} className={cn("", className)} {...props}>
      {children}
    </button>
  )
);
SidebarMenuAction.displayName = "SidebarMenuAction";

export const SidebarMenuBadge = React.forwardRef<HTMLSpanElement, React.ComponentProps<"span">>(
  ({ className, children, ...props }, ref) => (
    <span ref={ref} className={cn("text-xs", className)} {...props}>
      {children}
    </span>
  )
);
SidebarMenuBadge.displayName = "SidebarMenuBadge";

export const SidebarMenuSkeleton = () => <div className="h-6 w-full bg-muted" />;
