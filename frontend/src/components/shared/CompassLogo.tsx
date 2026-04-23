import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

type Props = {
    size?: number;
    className?: string;
    animate?: boolean;
};

/**
 * Brand compass icon — bold SVG with animated needle.
 * Higher contrast version: filled outer ring + stronger ticks.
 */
export function CompassLogo({ size = 40, className, animate = true }: Props) {
    return (
        <motion.svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            className={cn('shrink-0', className)}
            whileHover={animate ? { scale: 1.08, rotate: 5 } : undefined}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
            {/* Outer filled ring — makes it visible on white backgrounds */}
            <circle cx="50" cy="50" r="47" fill="none" className="stroke-primary" strokeWidth="3" opacity={0.25} />
            <circle cx="50" cy="50" r="42" fill="none" className="stroke-primary" strokeWidth="1.5" opacity={0.12} />

            {/* Tick marks NESW - bold */}
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

            {/* Compass needle — animated rotation */}
            <motion.g
                initial={animate ? { rotate: -30 } : undefined}
                animate={animate ? { rotate: 0 } : undefined}
                transition={animate ? { type: 'spring', stiffness: 60, damping: 12, delay: 0.3 } : undefined}
                style={{ transformOrigin: '50px 50px' }}
            >
                {/* North needle (primary blue — bold) */}
                <polygon points="50,14 43,50 50,45 57,50" className="fill-primary" />
                {/* South needle (muted) */}
                <polygon points="50,86 43,50 50,55 57,50" className="fill-primary" opacity={0.18} />
            </motion.g>

            {/* Center dot — larger, more visible */}
            <circle cx="50" cy="50" r="4.5" className="fill-primary" />
            <circle cx="50" cy="50" r="2" fill="white" />
        </motion.svg>
    );
}
