import axios from "axios";
import { API_BASE_URL, getHeaders } from "./apiClient";

export async function generateReport(userId: string, type: string) {
  console.log("HERE: ", userId, type);
  const res = await axios.post(
    `${API_BASE_URL}/reports/${userId}/generate`,
    {},
    {
      headers: getHeaders(true),
      params: { type },
    }
  );
  console.log("2. HERE: ", res.data);

  return res.data; // { reportId, path, downloadUrl }
}

export async function downloadReport(userId: string, filename: string) {
  console.log("FRONT: ", filename);

  const res = await axios.get(
    `${API_BASE_URL}/reports/download/${userId}/${filename}`,
    {
      headers: getHeaders(true),
      responseType: "blob",
    }
  );

  const url = window.URL.createObjectURL(new Blob([res.data as Blob]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export type LisUserReportsResponse = {
  downloadUrl: string;
  file: string;
};
export async function listUserReports(
  userId: string
): Promise<LisUserReportsResponse[]> {
  const res = await axios.get<LisUserReportsResponse[]>(
    `${API_BASE_URL}/reports/${userId}`,
    {
      headers: getHeaders(true),
    }
  );

  return res.data;
}
