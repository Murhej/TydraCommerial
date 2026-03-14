import { useEffect } from "react";

const BASE_TITLE = "Tydra Cleaning Services";
const DEFAULT_DESCRIPTION =
  "Commercial cleaning management and scheduling dashboard.";

export default function usePageMeta(title, description = DEFAULT_DESCRIPTION) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} | ${BASE_TITLE}` : BASE_TITLE;

    const metaName = "description";
    let meta = document.querySelector(`meta[name="${metaName}"]`);
    const hadMeta = Boolean(meta);

    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", metaName);
      document.head.appendChild(meta);
    }

    const prevDescription = meta.getAttribute("content");
    meta.setAttribute("content", description);

    return () => {
      document.title = prevTitle || BASE_TITLE;
      if (!hadMeta) {
        meta.remove();
        return;
      }
      meta.setAttribute("content", prevDescription || DEFAULT_DESCRIPTION);
    };
  }, [title, description]);
}
