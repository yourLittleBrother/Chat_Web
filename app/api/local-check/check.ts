import { NextRequest, NextResponse } from "next/server";
import { requestMyServer } from "../common-check";

async function makeRequest(req: NextRequest) {
  try {
    const api = await requestMyServer(req);
    const res = new NextResponse(api.body);
    res.headers.set("Content-Type", "application/json");
    res.headers.set("Cache-Control", "no-cache");
    return res;
  } catch (e) {
    return NextResponse.json(
      {
        error: true,
        msg: JSON.stringify(e),
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(req: NextRequest) {
  return makeRequest(req);
}

export async function GET(req: NextRequest) {
  return makeRequest(req);
}

export const runtime = "edge";