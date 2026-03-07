import { CafeteriaAttendanceModule } from "@/modules/kiosk-management/cafeteria-attendance/CafeteriaAttendanceModule";

export default function CafeteriaAttendancePage() {
    const url = process.env.CAFETERIA_ATTENDANCE_URL || process.env.CAFETERIA_ATTENDANCE_URL_VPN;

    return (
        <CafeteriaAttendanceModule url={url} />
    );
}