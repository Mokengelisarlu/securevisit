"use client";

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export function DigitalClock() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatDay = (date: Date) => {
        return date.toLocaleDateString("fr-FR", { weekday: "long" }).replace(/^\w/, (c) => c.toUpperCase());
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    return (
        <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-[1.25rem] px-6 py-2 shadow-sm">
            <div className="flex flex-col items-end border-r border-slate-100 pr-4">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-tight">
                    {formatDay(time)}
                </span>
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                    {formatDate(time)}
                </span>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                    <Clock className="w-4 h-4" />
                </div>
                <div className="font-mono text-xl font-black text-slate-800 tracking-tighter tabular-nums flex items-baseline">
                    {formatTime(time)}
                </div>
            </div>
        </div>
    );
}
