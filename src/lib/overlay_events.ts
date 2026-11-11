type OutsideEvent = { target: EventTarget | null; preventDefault: () => void };

const APP_LAYER_SELECTOR = "[data-sonner-toaster], [data-global-loading]";

export function ignoreAppLayerInteraction(event: OutsideEvent) {
  if (event.target instanceof Element && event.target.closest(APP_LAYER_SELECTOR))
    event.preventDefault();
}
