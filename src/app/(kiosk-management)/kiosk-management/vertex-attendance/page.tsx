import { VertexAttendanceModule } from "@/modules/kiosk-management/vertex-attendance/VertexAttendanceModule";

export default function VertexAttendancePage() {
    const url = process.env.VERTEX_ATTENDANCE_URL;

    return (
        <VertexAttendanceModule url={url} />
    );
}