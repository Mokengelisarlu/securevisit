"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Eraser, Check, FileSignature } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
    onSave: (signatureDataUrl: string) => void;
    onClear?: () => void;
}

export function SignaturePad({ onSave, onClear }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);
    const [isValidated, setIsValidated] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set line style
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Handle resizing
        const resizeCanvas = () => {
            const rect = canvas.parentElement?.getBoundingClientRect();
            if (rect) {
                // Save current content
                const tempImage = canvas.toDataURL();
                canvas.width = rect.width;
                canvas.height = 200;

                // Restore line style (resizing resets context)
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 3;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";

                // Redraw content if it wasn't empty
                if (!isEmpty) {
                    const img = new Image();
                    img.onload = () => ctx.drawImage(img, 0, 0);
                    img.src = tempImage;
                }
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [isEmpty]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (isValidated) return;
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.beginPath(); // Reset path
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || isValidated) return;
        setIsEmpty(false);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        let x, y;

        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
        setIsValidated(false);
        if (onClear) onClear();
    };

    const save = () => {
        const canvas = canvasRef.current;
        if (!canvas || isEmpty) return;
        onSave(canvas.toDataURL('image/png'));
        setIsValidated(true);
    };

    return (
        <div className="space-y-4">
            <div className={cn(
                "border-2 rounded-2xl bg-white overflow-hidden relative touch-none transition-all duration-300",
                isValidated ? "border-green-500 shadow-lg shadow-green-50" : "border-dashed border-gray-300 shadow-inner"
            )}>
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className={cn(
                        "w-full h-[200px] transition-opacity duration-300",
                        isValidated ? "opacity-50 cursor-default" : "cursor-crosshair"
                    )}
                />

                {isEmpty && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-gray-300 gap-2">
                        <FileSignature className="w-8 h-8 opacity-20" />
                        <span className="font-bold uppercase tracking-widest text-[10px]">Signez ici</span>
                    </div>
                )}

                {isValidated && (
                    <div className="absolute inset-0 bg-green-500/5 flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-300">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
                            <Check className="w-6 h-6 text-white" />
                        </div>
                        <span className="mt-3 font-black text-green-600 uppercase tracking-widest text-[10px]">
                            Signature enregistrée
                        </span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={clear}
                    className="h-14 rounded-2xl font-black text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-[0.98]"
                >
                    <Eraser className="w-5 h-5 mr-3" />
                    Effacer et recommencer
                </Button>

                <Button
                    type="button"
                    onClick={save}
                    disabled={isEmpty || isValidated}
                    className={cn(
                        "h-14 rounded-2xl font-black transition-all shadow-lg active:scale-[0.98]",
                        isValidated
                            ? "bg-green-500 hover:bg-green-500 text-white shadow-green-100 cursor-default"
                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100"
                    )}
                >
                    {isValidated ? (
                        <>
                            <Check className="w-6 h-6 mr-3" />
                            Validé avec succès
                        </>
                    ) : (
                        <>
                            <Check className="w-6 h-6 mr-3" />
                            Valider la signature
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
