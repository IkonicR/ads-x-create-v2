import { useState, useEffect } from 'react';

export const useMousePosition = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const updateMousePosition = (ev: MouseEvent) => {
            // Normalize strictly to -1 to 1 range relative to center of screen
            // This is crucial for 3D tilts where 0,0 is center
            const x = (ev.clientX / window.innerWidth) * 2 - 1;
            const y = (ev.clientY / window.innerHeight) * 2 - 1;
            setMousePosition({ x, y });
        };

        window.addEventListener('mousemove', updateMousePosition);

        return () => {
            window.removeEventListener('mousemove', updateMousePosition);
        };
    }, []);

    return mousePosition;
};
