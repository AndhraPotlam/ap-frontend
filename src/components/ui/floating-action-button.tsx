'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface FABAction {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}

interface FloatingActionButtonProps {
    actions: FABAction[];
    className?: string;
}

export function FloatingActionButton({ actions, className }: FloatingActionButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={cn('fixed bottom-6 right-6 z-50', className)}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute bottom-16 right-0 flex flex-col gap-3 mb-2"
                    >
                        {actions.map((action, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center gap-3"
                            >
                                <span className="text-sm font-medium bg-white px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                                    {action.label}
                                </span>
                                <Button
                                    size="icon"
                                    onClick={() => {
                                        action.onClick();
                                        setIsOpen(false);
                                    }}
                                    className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow"
                                >
                                    {action.icon}
                                </Button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Button
                    size="icon"
                    onClick={() => setIsOpen(!isOpen)}
                    className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
                >
                    <motion.div
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                    </motion.div>
                </Button>
            </motion.div>
        </div>
    );
}
