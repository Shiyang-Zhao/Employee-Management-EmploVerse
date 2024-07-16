import { NextRequest, NextResponse } from 'next/server';
import ExternalAuthAPI from '@/services/external/AuthAPI';
import { LoginDTO } from '@/models/AuthDTO';

export async function POST(request: NextRequest) {
    const { email, password }: LoginDTO = await request.json();
    const data = await ExternalAuthAPI.login({ email, password });
    console.log("External login success:", data);
    return NextResponse.json(data);
}
