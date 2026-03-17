"use client";

import * as React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
} from "@/components/ui/pagination";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    AlertTriangle, 
    RefreshCw, 
    Clock, 
    CheckCircle2, 
    XCircle,
    FileSearch,
    Loader2,
    Trash2
} from "lucide-react";
import { toast } from "sonner";
import type { AssetPerimeterAlertWithDetails, AlertStatus } from "../type";
import { fetchAlerts, deleteAlert } from "../providers/fetchProvider";

interface AlertListProps {
    refreshTrigger?: number;
}

export function AlertList({ refreshTrigger = 0 }: AlertListProps) {
    const [statusFilter, setStatusFilter] = React.useState<string>("all");
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [alertToDelete, setAlertToDelete] = React.useState<number | null>(null);
    const [isMounted, setIsMounted] = React.useState(false);
    const [alerts, setAlerts] = React.useState<AssetPerimeterAlertWithDetails[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 5;

    // Fix hydration error by only rendering Select after mount
    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    // Fetch alerts
    const loadAlerts = React.useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchAlerts(statusFilter);
            setAlerts(data);
            setCurrentPage(1); // Reset to first page when data changes
        } catch (error) {
            console.error("Error fetching alerts:", error);
            toast.error("Failed to fetch alerts. Please check your connection.");
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    React.useEffect(() => {
        void loadAlerts();
    }, [loadAlerts, refreshTrigger]);

    // Calculate pagination
    const totalPages = Math.ceil(alerts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentAlerts = alerts.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleDeleteClick = (alertId: number) => {
        setAlertToDelete(alertId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!alertToDelete) return;

        setIsDeleting(true);
        
        try {
            await deleteAlert(alertToDelete);
            
            // Remove deleted alert from local state
            setAlerts(alerts.filter(alert => alert.alert_id !== alertToDelete));
            
            toast.success("Alert deleted successfully");
        } catch (error) {
            console.error("Error deleting alert:", error);
            toast.error("Failed to delete alert. Please try again.");
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setAlertToDelete(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { variant: "default" | "destructive" | "secondary" | "outline", icon: React.ReactNode }> = {
            "New": { 
                variant: "destructive", 
                icon: <AlertTriangle className="h-3 w-3" /> 
            },
            "Under Investigation": { 
                variant: "default", 
                icon: <FileSearch className="h-3 w-3" /> 
            },
            "Resolved": { 
                variant: "secondary", 
                icon: <CheckCircle2 className="h-3 w-3" /> 
            },
            "False Alarm": { 
                variant: "outline", 
                icon: <XCircle className="h-3 w-3" /> 
            },
        };

        const config = statusMap[status] || { variant: "default" as const, icon: null };

        return (
            <Badge variant={config.variant} className="gap-1.5">
                {config.icon}
                {status}
            </Badge>
        );
    };

    return (
        <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Alerts Warning</h2>
                        <p className="text-sm text-muted-foreground">
                            {alerts.length} {alerts.length === 1 ? "alert" : "alerts"} found
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isMounted ? (
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-45">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="New">New</SelectItem>
                                <SelectItem value="Under Investigation">Under Investigation</SelectItem>
                                <SelectItem value="Resolved">Resolved</SelectItem>
                                <SelectItem value="Closed">False Alarm</SelectItem>
                            </SelectContent>
                        </Select>
                    ) : (
                        <div className="w-45 h-10 border rounded-md bg-background" />
                    )}

                    <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => void loadAlerts()}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : alerts.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">No Alerts</h3>
                        <p className="text-sm text-muted-foreground">
                            {statusFilter === "all" 
                                ? "All assets are secure. No alerts recorded."
                                : `No alerts with status "${statusFilter}".`
                            }
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Asset Information</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Scanned At</TableHead>
                                    <TableHead>Status</TableHead>
                                    {/* <TableHead className="text-right">Actions</TableHead> */}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentAlerts.map((alert) => (
                                <TableRow key={alert.alert_id}>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <p className="font-medium">
                                                {alert.asset_details?.item_name || "Unknown Asset"}
                                            </p>
                                            <div className="text-xs text-muted-foreground space-y-0.5">
                                                <p>Asset ID: {alert.asset_id}</p>
                                                {alert.accountable_user_name && (
                                                    <p>Accountable: {alert.accountable_user_name}</p>
                                                )}
                                                <p>Serial: {alert.asset_details?.serial || 'N/A'}</p>
                                                {alert.asset_details?.barcode && (
                                                    <p>Barcode: {alert.asset_details.barcode}</p>
                                                )}
                                                {/* {alert.asset_details?.employee_name && (
                                                    <p>Employee: {alert.asset_details.employee_name}</p>
                                                )} */}
                                                {alert.asset_details?.encoder_name && (
                                                    <p>Encoder: {alert.asset_details.encoder_name}</p>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-0.5">
                                            <p className="font-medium text-sm">
                                                {alert.scanner_location_name || "Unknown"}
                                            </p>
                                            <p className="text-xs text-muted-foreground font-mono">
                                                {alert.scanner_gate_id || "N/A"}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-medium">
                                                    {(() => {
                                                        // Parse as local time (database stores GMT+8 local time)
                                                        const date = new Date(alert.scanned_at);
                                                        return date.toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        });
                                                    })()}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {(() => {
                                                        // Parse as local time (database stores GMT+8 local time)
                                                        const date = new Date(alert.scanned_at);
                                                        return date.toLocaleTimeString('en-PH', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            second: '2-digit',
                                                            hour12: true
                                                        });
                                                    })()}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(alert.alert_status)}
                                    </TableCell>
                                    {/* <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteClick(alert.alert_id)}
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell> */}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex justify-end items-center">
                    <Pagination className="min-w-auto flex justify-end items-center">
                        <PaginationContent>
                            <PaginationItem>
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (currentPage > 1) {
                                            handlePageChange(currentPage - 1);
                                        }
                                    }}
                                    disabled={currentPage === 1}
                                    className={`inline-flex items-center justify-center gap-1 px-2.5 h-9 rounded-md text-sm transition-colors ${
                                        currentPage === 1 
                                            ? "pointer-events-none opacity-50 bg-transparent" 
                                            : "cursor-pointer hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                        <path d="m15 18-6-6 6-6"/>
                                    </svg>
                                    <span className="hidden sm:block">Previous</span>
                                </button>
                            </PaginationItem>
                            
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                // Show first page, last page, current page, and pages around current
                                if (
                                    page === 1 ||
                                    page === totalPages ||
                                    (page >= currentPage - 1 && page <= currentPage + 1)
                                ) {
                                    return (
                                        <PaginationItem key={page}>
                                            <button
                                                type="button"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handlePageChange(page);
                                                }}
                                                className={`inline-flex items-center justify-center h-9 w-9 rounded-md text-sm transition-colors cursor-pointer ${
                                                    currentPage === page
                                                        ? "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                                                        : "hover:bg-accent hover:text-accent-foreground"
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        </PaginationItem>
                                    );
                                } else if (
                                    page === currentPage - 2 ||
                                    page === currentPage + 2
                                ) {
                                    return (
                                        <PaginationItem key={page}>
                                            <PaginationEllipsis />
                                        </PaginationItem>
                                    );
                                }
                                return null;
                            })}
                            
                            <PaginationItem>
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (currentPage < totalPages) {
                                            handlePageChange(currentPage + 1);
                                        }
                                    }}
                                    disabled={currentPage === totalPages}
                                    className={`inline-flex items-center justify-center gap-1 px-2.5 h-9 rounded-md text-sm transition-colors ${
                                        currentPage === totalPages 
                                            ? "pointer-events-none opacity-50 bg-transparent" 
                                            : "cursor-pointer hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                >
                                    <span className="hidden sm:block">Next</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                        <path d="m9 18 6-6-6-6"/>
                                    </svg>
                                </button>
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Alert</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this alert (#{alertToDelete})? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}