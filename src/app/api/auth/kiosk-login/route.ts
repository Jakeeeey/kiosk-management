import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

// Department IDs authorized to access the entire Kiosk Management system
const AUTHORIZED_DEPARTMENT_IDS = [2, 13];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as { rfidCode?: string };
        const rfidCode = body.rfidCode?.trim();

        if (!rfidCode) {
            return NextResponse.json(
                { success: false, message: "RFID code is required." },
                { status: 400 }
            );
        }

        if (!API_BASE) {
            console.error("[Auth] Missing NEXT_PUBLIC_API_BASE_URL");
            return NextResponse.json(
                { success: false, message: "Server configuration error." },
                { status: 500 }
            );
        }

        // Build URL for public user collection query
        const qs = new URLSearchParams({
            "filter[rf_id][_eq]": rfidCode,
            "fields": "user_id,user_department,user_fname,user_lname",
            "limit": "1",
        });

        const requestUrl = `${API_BASE}/items/user?${qs.toString()}`;

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (TOKEN) {
            headers["Authorization"] = `Bearer ${TOKEN}`;
        }

        console.log("[Auth] Fetching:", requestUrl);

        const userRes = await fetch(requestUrl, { headers });
        const rawText = await userRes.text();

        if (!userRes.ok) {
            console.error("[Auth] Directus validation failed:", userRes.status, rawText);
            return NextResponse.json(
                {
                    success: false,
                    message: "Database authentication failed.",
                },
                { status: 502 }
            );
        }

        const userData = JSON.parse(rawText) as { data: Array<{ user_id: number; user_department: number | string; user_fname: string; user_lname: string }> };
        const user = userData.data?.[0];

        if (!user) {
            return NextResponse.json(
                { success: false, message: "RFID card not recognized." },
                { status: 401 }
            );
        }

        // Authorize if user belongs to department ID 2 or 13
        const isAuthorized = AUTHORIZED_DEPARTMENT_IDS.includes(Number(user.user_department));

        if (!isAuthorized) {
            return NextResponse.json(
                { success: false, message: "Your department is not authorized for Kiosk access." },
                { status: 403 }
            );
        }

        // Generate a 365-day tracking token cookie
        const cookieStore = await cookies();

        // Simple token format (can be a JWT in real-world scenarios)
        const tokenPayload = btoa(JSON.stringify({ userId: user.user_id, dept: user.user_department, timestamp: Date.now() }));

        cookieStore.set("kiosk_token", tokenPayload, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 365, // 365 days
            path: "/",
        });

        return NextResponse.json({
            success: true,
            user: {
                firstName: user.user_fname,
                lastName: user.user_lname,
            }
        }, { status: 200 });

    } catch (err) {
        console.error("[Auth] Unexpected login error:", err);
        return NextResponse.json(
            { success: false, message: "Internal server error." },
            { status: 500 }
        );
    }
}
