import { HanvinAttendanceModule } from "@/modules/kiosk-management/hanvin-attendance/HanvinAttendanceModule";

export default function HanvinAttendancePage() {
    const url = process.env.HANVIN_ATTENDANCE_URL;

    return (
        <HanvinAttendanceModule url={url} />
    );
}