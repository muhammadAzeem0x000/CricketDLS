'use client';

import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface ToastProps {
    message: string;
    type: 'error' | 'success';
    onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'error' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200';
    const textColor = type === 'error' ? 'text-red-800' : 'text-green-800';
    const Icon = type === 'error' ? AlertCircle : CheckCircle2;
    const iconColor = type === 'error' ? 'text-red-500' : 'text-green-500';

    return (
        <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-2 fade-in duration-300">
            <div
                className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm ${bgColor}`}
            >
                <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
                <p className={`text-sm font-medium flex-1 ${textColor}`}>{message}</p>
                <button
                    onClick={onClose}
                    className="p-0.5 hover:bg-black/5 rounded transition-colors"
                >
                    <X className={`w-4 h-4 ${textColor}`} />
                </button>
            </div>
        </div>
    );
}
