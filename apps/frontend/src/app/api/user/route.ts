import { prismaClient } from "@repo/database/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const res = await prismaClient.user.findMany()
    return NextResponse.json(res)
}
  