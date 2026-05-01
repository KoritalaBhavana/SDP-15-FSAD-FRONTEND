import { useEffect, useState } from "react";
import { homestaysApi } from "@/lib/api";
import { adaptHomestay, type FrontendHomestay } from "@/lib/homestayApiAdapter";

export const useHomestays = () => {
  const [homestays, setHomestays] = useState<FrontendHomestay[]>([]);

  useEffect(() => {
    let ignore = false;

    const refreshHomestays = async () => {
      try {
        const response = await homestaysApi.getAll();
        if (!ignore && Array.isArray(response)) {
          setHomestays(response.map(adaptHomestay));
        }
      } catch {
        if (!ignore) {
          setHomestays([]);
        }
      }
    };

    refreshHomestays();

    const handleHomestaysUpdated = () => {
      void refreshHomestays();
    };

    window.addEventListener("travelnest:homestays-updated", handleHomestaysUpdated);

    return () => {
      ignore = true;
      window.removeEventListener("travelnest:homestays-updated", handleHomestaysUpdated);
    };
  }, []);

  return homestays;
};
