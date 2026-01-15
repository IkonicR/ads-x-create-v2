import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

// Real assets from Supabase (using 3 high-quality ones)
const CAROUSEL_IMAGES = [
    'https://afzrfcqidscibmgptkcl.supabase.co/storage/v1/object/public/business-assets/ag54vxxn0/generated/1768404384127_vn0sfd.png',
    'https://afzrfcqidscibmgptkcl.supabase.co/storage/v1/object/public/business-assets/ag54vxxn0/generated/1768403761870_uq0ri.png',
    'https://afzrfcqidscibmgptkcl.supabase.co/storage/v1/object/public/business-assets/ag54vxxn0/generated/1768403406934_7kzlb.png',
];

const AUTO_INTERVAL = 5000; // 5 seconds

/**
 * MenuCarousel - Interactive draggable image gallery
 * Features:
 * - Drag to swipe
 * - Auto-advance
 * - Pagination dots
 * - Pause on hover
 */
const MenuCarousel: React.FC = () => {
    const [[page, direction], setPage] = useState([0, 0]);
    const [isPaused, setIsPaused] = useState(false);

    // Compute absolute index (cyclic)
    const imageIndex = Math.abs(page % CAROUSEL_IMAGES.length);

    // Pagination/Navigation
    const paginate = (newDirection: number) => {
        setPage(([prevPage]) => [prevPage + newDirection, newDirection]);
    };

    // Auto-advance logic
    useEffect(() => {
        if (isPaused) return;

        const timer = setInterval(() => {
            paginate(1);
        }, AUTO_INTERVAL);

        return () => clearInterval(timer);
    }, [page, isPaused]);

    // Drag Handler
    const handleDragEnd = (e: any, { offset, velocity }: PanInfo) => {
        const swipe = swipePower(offset.x, velocity.x);

        if (swipe < -swipeConfidenceThreshold) {
            paginate(1);
        } else if (swipe > swipeConfidenceThreshold) {
            paginate(-1);
        }
    };

    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset: number, velocity: number) => {
        return Math.abs(offset) * velocity;
    };

    return (
        <div
            className="relative w-full h-full overflow-hidden rounded-3xl bg-neu-dark"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <AnimatePresence initial={false} custom={direction}>
                <motion.img
                    key={page}
                    src={CAROUSEL_IMAGES[imageIndex]}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={handleDragEnd}
                    className="absolute inset-0 w-full h-full object-cover cursor-grab active:cursor-grabbing"
                    alt="Gallery"
                />
            </AnimatePresence>

            {/* Pagination Dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 px-4 py-2 bg-black/30 backdrop-blur-md rounded-full items-center z-10">
                {CAROUSEL_IMAGES.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            const diff = idx - imageIndex;
                            if (diff !== 0) {
                                setPage(([prev]) => [prev + diff, diff]);
                            }
                        }}
                        className={`transition-all duration-300 rounded-full ${idx === imageIndex
                                ? 'w-3 h-3 bg-brand'
                                : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                            }`}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

const variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 1000 : -1000,
        opacity: 0
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0
    })
};

export default MenuCarousel;
