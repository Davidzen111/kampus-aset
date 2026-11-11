import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { api, getToken, goTo } from "../api";
import { ROUTES } from "../config";
import { toast } from "./dialogs";


export default function RequireRole({ role }) {
  const [me, setMe] = useState(null);

  useEffect(() => {
    if (!getToken()) { goTo(ROUTES.login); return; }
    api("/auth/me")
      .then(u => {
        const ok = role === "admin" ? u.is_admin : !u.is_admin;
        if (ok) setMe(u);
        else goTo(u.is_admin ? ROUTES.adminHome : ROUTES.userHome);
      })
      .catch(e => toast(e.message, true));
  }, [role]);

  if (!me) return null;
  return <Outlet context={{ me, setMe }} />;
}