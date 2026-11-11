import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group pointer-events-auto"
      position="top-right"
      closeButton
      swipeDirections={[]}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-(--width) items-start gap-3 rounded-lg border px-4 py-3 text-sm text-foreground shadow-md",
          icon: "mt-0.5 flex shrink-0 text-muted-foreground",
          content: "flex min-w-0 flex-1 flex-col gap-1",
          title: "font-medium leading-5",
          description: "text-xs text-text-2",
          actionButton:
            "shrink-0 cursor-pointer self-center rounded-md border border-current/20 bg-card px-2 py-1 text-xs font-medium hover:bg-muted",
          closeButton:
            "absolute top-0 right-0 flex size-5 translate-x-1/3 -translate-y-1/3 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground",
          default: "border-border bg-card",
          loading: "border-border bg-card",
          success: "border-good/30 bg-good-bg [&_[data-icon]]:text-good",
          error: "border-bad/30 bg-bad-bg [&_[data-icon]]:text-bad",
          warning: "border-warn-line bg-warn-bg [&_[data-icon]]:text-warn",
          info: "border-brand-muted bg-brand-soft [&_[data-icon]]:text-brand",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
