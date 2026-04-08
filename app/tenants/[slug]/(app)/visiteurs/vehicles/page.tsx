"use client";

import { useMemo, useState } from "react";
import {
    Search,
    Car,
    Truck,
    Bike,
    Settings2,
    Calendar,
    Eye,
    PackageOpen,
    Loader2,
    Filter
} from "lucide-react";
import { useTenant } from "@/lib/tenant-provider";
import { useGetVehicles } from "@/features/tenants/hooks/useGetTenantData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";

export default function VehiclesPage() {
    const { slug: tenantSlug } = useTenant();
    const [searchQuery, setSearchQuery] = useState("");

    const { data: vehicles, isLoading } = useGetVehicles(tenantSlug!);

    const filteredVehicles = useMemo(() => {
        if (!vehicles) return [];
        return vehicles.filter((v: any) =>
            v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (v.brand && v.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (v.color && v.color.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [vehicles, searchQuery]);

    const getVehicleIcon = (type: string) => {
        switch (type) {
            case "TRUCK": return <Truck className="w-5 h-5" />;
            case "MOTORCYCLE": return <Bike className="w-5 h-5" />;
            default: return <Car className="w-5 h-5" />;
        }
    };

    return (
        <div className="space-y-8 py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-teal-700 shadow-sm">
                        <Car className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Gestion des Véhicules</h1>
                        <p className="text-gray-500 font-medium italic">Consultez et gérez la flotte des véhicules ayant accédé à vos sites.</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border shadow-sm">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Rechercher par plaque, marque..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11 border-gray-200 focus:ring-teal-500 rounded-lg"
                        />
                    </div>
                    <div className="text-sm font-medium text-gray-500 bg-gray-50 px-4 py-2 rounded-full border">
                        {filteredVehicles.length} Véhicules trouvés
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden min-h-[400px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-20 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
                            <p className="text-gray-500 font-medium">Chargement des véhicules...</p>
                        </div>
                    ) : filteredVehicles.length > 0 ? (
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="py-4 px-6 text-xs font-bold uppercase text-gray-500">Plaque</TableHead>
                                    <TableHead className="py-4 px-6 text-xs font-bold uppercase text-gray-500">Type & Marque</TableHead>
                                    <TableHead className="py-4 px-6 text-xs font-bold uppercase text-gray-500">Couleur</TableHead>
                                    <TableHead className="py-4 px-6 text-xs font-bold uppercase text-gray-500">Dernière visite</TableHead>
                                    <TableHead className="py-4 px-6 text-right text-xs font-bold uppercase text-gray-500">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredVehicles.map((vehicle: any) => (
                                    <TableRow key={vehicle.id} className="hover:bg-gray-50/30 transition-colors">
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-8 bg-gray-900 flex items-center justify-center rounded border border-gray-700 shadow-sm relative overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-full h-0.5 bg-teal-500" />
                                                    <span className="text-xs font-mono font-black text-white tracking-widest uppercase">{vehicle.plateNumber}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                                    <div className="text-teal-500">{getVehicleIcon(vehicle.type)}</div>
                                                    {vehicle.type}
                                                </div>
                                                <div className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                                                    <Settings2 className="w-3 h-3" />
                                                    {vehicle.brand || "Marque non renseignée"}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            {vehicle.color ? (
                                                <Badge variant="outline" className="h-6 px-2.5 border-gray-200 bg-gray-50 text-gray-600 font-bold text-[10px] uppercase">
                                                    {vehicle.color}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-gray-300 italic">Non renseignée</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                                <Calendar className="w-4 h-4 text-gray-300" />
                                                {vehicle.createdAt ? format(new Date(vehicle.createdAt), "dd/MM/yyyy HH:mm") : "N/A"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-right">
                                            <Link href={`/visiteurs/vehicles/${vehicle.id}`}>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-9 px-4 rounded-xl border-gray-200 text-[#0DBDB5] hover:bg-teal-50 font-bold flex items-center gap-2"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Historique
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-20 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <PackageOpen className="w-8 h-8 text-gray-200" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Aucun véhicule trouvé</h3>
                            <p className="text-gray-500 max-w-sm mt-1">
                                Aucun véhicule n'a encore été enregistré pour ce site.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
