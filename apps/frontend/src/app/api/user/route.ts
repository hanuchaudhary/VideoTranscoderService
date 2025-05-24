import { db } from "@repo/database/client";
import { user } from "@repo/database/schema";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const res = await db.select().from(user)
    return NextResponse.json(res, {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    });
}
  