"use client";

import { X, ZoomIn, Download } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    title?: string;
}

export function ImageModal({ isOpen, onClose, imageUrl, title = "Aperçu de l'image" }: ImageModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        if (isOpen) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleEscape);
        }

        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Overlay with heavy blur */}
            <div
                ref={overlayRef}
                className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col items-center animate-in fade-in zoom-in duration-300">
                {/* Header Actions */}
                <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                    <button
                        onClick={onClose}
                        className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all hover:scale-110"
                        title="Fermer"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Image Wrapper */}
                <div className="bg-transparent rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/20 w-fit">
                    <img
                        src={imageUrl}
                        alt={title}
                        className="max-h-[80vh] w-auto h-auto object-contain select-none"
                    />
                </div>

                {/* Title/Label */}
                {title && (
                    <div className="mt-6 px-6 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                        <p className="text-white font-bold tracking-wide uppercase text-xs">{title}</p>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
