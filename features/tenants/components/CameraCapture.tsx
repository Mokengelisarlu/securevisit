"use client";

import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Check, AlertCircle } from "lucide-react";

interface CameraCaptureProps {
    onCapture: (dataUrl: string) => void;
    title?: string;
    description?: string;
    defaultFacingMode?: "user" | "environment";
}

export function CameraCapture({ 
    onCapture, 
    title, 
    description,
    defaultFacingMode = "user"
}: CameraCaptureProps) {
    const webcamRef = useRef<Webcam>(null);
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<"user" | "environment">(defaultFacingMode);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setImgSrc(imageSrc);
        }
    }, [webcamRef]);

    const toggleCamera = () => {
        setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    };

    const retake = () => {
        setImgSrc(null);
        setError(null);
    };

    const confirm = () => {
        if (imgSrc) {
            onCapture(imgSrc);
        }
    };

    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: facingMode,
    };

    return (
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
            {(title || description) && (
                <div className="text-center space-y-2">
                    {title && <h3 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h3>}
                    {description && <p className="text-gray-500 font-medium">{description}</p>}
                </div>
            )}

            <div className="relative w-full max-w-lg aspect-video bg-gray-900 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white ring-1 ring-gray-100">
                {imgSrc ? (
                    <img src={imgSrc} alt="Capture" className="w-full h-full object-cover" />
                ) : (
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
                        onUserMediaError={() => setError("Impossible d'accéder à la caméra. Veuillez vérifier les permissions.")}
                        className="w-full h-full object-cover"
                    />
                )}

                {error && (
                    <div className="absolute inset-0 bg-gray-900/90 flex flex-col items-center justify-center p-8 text-center text-white gap-4">
                        <AlertCircle className="w-12 h-12 text-red-500" />
                        <p className="font-bold">{error}</p>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
                {!imgSrc ? (
                    <>
                        <Button
                            onClick={capture}
                            disabled={!!error}
                            className="h-16 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl flex items-center gap-3 transition-all active:scale-95"
                        >
                            <Camera className="w-6 h-6" />
                            Prendre la photo
                        </Button>
                        <Button
                            variant="outline"
                            onClick={toggleCamera}
                            disabled={!!error}
                            className="h-16 px-6 border-2 border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 flex items-center gap-3"
                        >
                            <RefreshCw className="w-6 h-6" />
                            <span className="hidden md:inline">Changer de caméra</span>
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            variant="outline"
                            onClick={retake}
                            className="h-16 px-8 border-2 border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 flex items-center gap-3"
                        >
                            <RefreshCw className="w-6 h-6" />
                            Recommencer
                        </Button>
                        <Button
                            onClick={confirm}
                            className="h-16 px-8 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-xl flex items-center gap-3 transition-all active:scale-95"
                        >
                            <Check className="w-6 h-6" />
                            Confirmer
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
