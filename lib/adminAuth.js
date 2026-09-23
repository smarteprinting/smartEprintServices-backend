import { getTokenFromRequest, verifyToken } from "@/lib/jwt";

export async function isAdminRequest(request) {
  const token = getTokenFromRequest(request);
  const payload = await verifyToken(token);
  return Boolean(payload?.isAdmin === true);
}
