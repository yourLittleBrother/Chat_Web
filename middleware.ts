import { NextRequest, NextResponse } from "next/server";
import { getServerSideConfig } from "./app/config/server";
import md5 from "spark-md5";

export const config = {
  matcher: ["/api/openai", "/api/chat-stream"],
};

const serverConfig = getServerSideConfig();

function getIP(req: NextRequest) {
  let ip = req.ip ?? req.headers.get("x-real-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");

  if (!ip && forwardedFor) {
    ip = forwardedFor.split(",").at(0) ?? "";
  }

  return ip;
}

export function middleware(req: NextRequest) {
  const accessCode = req.headers.get("access-code");
  const accessOwnCode = req.headers.get("access-own-code");
  const token = req.headers.get("token");
  const hashedCode = md5.hash(accessCode ?? "").trim();
  let num = 0;
  console.log("[Auth] allowed hashed codes: ", [...serverConfig.codes]);
  console.log("[Auth] got access code:", accessCode);
  console.log("[Auth] hashed access code:", hashedCode);
  console.log("[User IP] ", getIP(req));
  console.log("[Time] ", new Date().toLocaleString());

  let param = { "accessCode": accessOwnCode }
  //先检查code是否还有次数http://127.0.0.1:8384
  fetch("https://talk.tianyajuanke.top/user/checkUserCode", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(param)
  })
    .then(response => response.json())
    .then(data => {
      num = Number(data)
      console.log('Success:', data);
      if (num < 1) {
        return NextResponse.json(
          {
            error: true,
            needAccessCode: true,
            msg: "Please go settings page and fill your access code.",
          },
          {
            status: 401,
          },
        );
      }
    })
    .catch((error) => {
      return NextResponse.json(
        {
          error: true,
          needAccessCode: true,
          msg: "Please go settings page and fill your access code.",
        },
        {
          status: 401,
        },
      );
    });





  if (serverConfig.needCode && !serverConfig.codes.has(hashedCode) && !token) {
    return NextResponse.json(
      {
        error: true,
        needAccessCode: true,
        msg: "Please go settings page and fill your access code.",
      },
      {
        status: 401,
      },
    );
  }

  // inject api key
  if (!token) {
    const apiKey = serverConfig.apiKey;
    if (apiKey) {
      console.log("[Auth] set system token");
      req.headers.set("token", apiKey);
    } else {
      return NextResponse.json(
        {
          error: true,
          msg: "Empty Api Key",
        },
        {
          status: 401,
        },
      );
    }
  } else {
    console.log("[Auth] set user token");
  }

  return NextResponse.next({
    request: {
      headers: req.headers,
    },
  });
}
