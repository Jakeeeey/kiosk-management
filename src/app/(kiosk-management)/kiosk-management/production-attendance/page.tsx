import { ProductionAttendanceModule } from "@/modules/kiosk-management/production-attendance/ProductionAttendanceModule";

export default function ProductionAttendancePage() {
    const url = process.env.PRODUCTION_ATTENDANCE_URL || process.env.PRODUCTION_ATTENDANCE_URL_VPN;

    return (
        <ProductionAttendanceModule url={url} />
    );
}