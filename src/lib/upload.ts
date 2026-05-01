import apiClient from "@/lib/axios";

const toPublicUrl = (url: string) => {
  if (!url || /^https?:\/\//i.test(url) || url.startsWith("data:")) {
    return url;
  }

  const apiBaseUrl = (apiClient.defaults.baseURL || "").replace(/\/api\/?$/, "");
  return `${apiBaseUrl}${url.startsWith("/") ? url : `/${url}`}`;
};

export const uploadFiles = async (files: File[]) => {
  const results: string[] = [];

  for (const file of files) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post("/files/upload", formData);
    const data = response.data as { url?: string; fileUrl?: string };
    results.push(toPublicUrl(data.url || data.fileUrl || ""));
  }

  return results.filter(Boolean);
};
