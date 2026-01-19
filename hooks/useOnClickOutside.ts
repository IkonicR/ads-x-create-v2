import { useEffect, RefObject } from 'react';

type Event = MouseEvent | TouchEvent;

export const useOnClickOutside = <T extends HTMLElement = HTMLElement>(
    ref: RefObject<T>,
    handler: (event: Event) => void
) => {
    useEffect(() => {
        const listener = (event: Event) => {
            const el = ref?.current;
            const target = event.target as Node;

            // Do nothing if clicking ref's element or descendent elements
            if (!el || el.contains(target || null)) {
                return;
            }

            // Ignore clicks inside portal dropdowns (they have data-portal-dropdown attribute)
            // This prevents parent menus from closing when interacting with nested portal elements
            if (target instanceof HTMLElement) {
                const portalAncestor = target.closest('[data-portal-dropdown="true"]');
                if (portalAncestor) {
                    return;
                }
            }

            handler(event);
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
};
