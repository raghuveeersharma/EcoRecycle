import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Resets scroll position on navigation, which the router does not do itself. */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
