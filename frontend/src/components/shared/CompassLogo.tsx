import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

type Props = {
    size?: number;
    className?: string;
    animate?: boolean;
};

/**
 * Brand compass icon.
 * Needle uses CSS @keyframes (no Framer rotate) → no non-composited spin → CLS fixed.
 * whileHover scale is compositable (only scale, no rotate).
 */
export function CompassLogo({ size = 40, className, animate = true }: Props) {
    return (
        <motion.svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            className={cn('shrink-0', className)}
            whileHover={animate ? { scale: 1.08 } : undefined}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
            {/* Outer rings */}
            <circle cx="50" cy="50" r="47" fill="none" className="stroke-primary" strokeWidth="3" opacity={0.25} />
            <circle cx="50" cy="50" r="42" fill="none" className="stroke-primary" strokeWidth="1.5" opacity={0.12} />

            {/* Major tick marks (NESW) */}
            {[0, 90, 180, 270].map((deg) => (
                <line
                    key={deg}
                    x1="50" y1="7" x2="50" y2="15"
                    className="stroke-primary"
                    strokeWidth="2.5"
                    opacity={0.4}
                    transform={`rotate(${deg} 50 50)`}
                />
            ))}

            {/* Minor tick marks */}
            {[45, 135, 225, 315].map((deg) => (
                <line
                    key={deg}
                    x1="50" y1="10" x2="50" y2="15"
                    className="stroke-primary"
                    strokeWidth="1.2"
                    opacity={0.2}
                    transform={`rotate(${deg} 50 50)`}
                />
            ))}

            {/*
             * Compass needle — CSS @keyframes only (no Framer rotate).
             * Framer rotate on SVG child = non-composited 'spin' = CLS culprit.
             * CSS animation on SVG <g> with explicit transformOrigin = compositable.
             */}
            <g
                style={animate ? {
                    transformOrigin: '50px 50px',
                    animation: 'needle-settle 0.9s cubic-bezier(0.22,1,0.36,1) 0.3s both',
                } : undefined}
            >
                <polygon points="50,14 43,50 50,45 57,50" className="fill-primary" />
                <polygon points="50,86 43,50 50,55 57,50" className="fill-primary" opacity={0.18} />
            </g>

            {/* Center dot */}
            <circle cx="50" cy="50" r="4.5" className="fill-primary" />
            <circle cx="50" cy="50" r="2" fill="white" />
        </motion.svg>
    );
}
