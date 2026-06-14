import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// Get group members
export async function GET() {
  try {
    const groupId = "flatmates-group-id";
    const members = await db.groupMember.findMany({
      where: { groupId },
      include: { user: true },
      orderBy: { joinDate: "asc" },
    });

    return NextResponse.json(members);
  } catch (error: any) {
    console.error("Fetch members error:", error);
    return NextResponse.json({ error: "Failed to fetch members: " + error.message }, { status: 500 });
  }
}

// Update group member dates (Dynamic membership management)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { memberId, joinDate, leaveDate } = body;

    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    const updatedMember = await db.groupMember.update({
      where: { id: memberId },
      data: {
        joinDate: joinDate ? new Date(joinDate) : undefined,
        leaveDate: leaveDate ? new Date(leaveDate) : null, // Support setting to null (active)
      },
    });

    return NextResponse.json(updatedMember);
  } catch (error: any) {
    console.error("Update member error:", error);
    return NextResponse.json({ error: "Failed to update member: " + error.message }, { status: 500 });
  }
}
