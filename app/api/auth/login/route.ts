import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prismadb from "@/lib/prismadb";
var bcrypt = require("bcryptjs");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const user = await prismadb.user.findUnique({
      where: { email },
    });

    if (!user) {
      return new NextResponse("Invalid credentials", { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return new NextResponse("Invalid credentials", { status: 401 });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.SECRET_KEY || "HelloKey",
      {
        expiresIn: "24h",
      }
    );

    const modifiedUser = { name: user.name, email: user.email, id: user.id };

    const response = new NextResponse(
      JSON.stringify({
        message: "Successfully logged in",
        user: { ...modifiedUser },
      })
    );

    response.headers.set(
      "Set-Cookie",
      `token=${token}; HttpOnly; Path=/; Max-Age=86400`
    );
    // cookie will set for 1 day

    return response;
  } catch (error) {
    console.log(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
