'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const HOME_PATH = "/";

const isTokenUsable = (token) => {
  if (!token) return false;

  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );

    return !payload.exp || payload.exp * 1000 > Date.now();
  } catch (error) {
    return false;
  }
};

const layout = ({ children }) => {
  const router = useRouter();
  const [canShow, setCanShow] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (isTokenUsable(token)) {
      router.replace(HOME_PATH);
      return;
    }

    if (token) localStorage.removeItem("token");

    setCanShow(true);
  }, [router]);

  if (!canShow) return null;

  return children;
};

export default layout;