import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(): Promise<NextResponse> {
  try {
    const accounts = await prisma.googleAccount.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        pictureUrl: true,
        tokenStatus: true,
        quotaTotal: true,
        quotaUsed: true,
        lastSyncAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const serialized = accounts.map((account) => ({
      ...account,
      quotaTotal: account.quotaTotal?.toString() ?? null,
      quotaUsed: account.quotaUsed?.toString() ?? null,
      lastSyncAt: account.lastSyncAt?.toISOString() ?? null,
      createdAt: account.createdAt.toISOString(),
    }));

    return NextResponse.json({ accounts: serialized });
  } catch (err) {
    return NextResponse.json({ error: "Error fetching accounts" }, { status: 500 });
  }
}
