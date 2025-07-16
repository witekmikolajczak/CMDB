import axios from "axios";
import { API_BASE_URL, getHeaders } from "./apiClient";

export const updateAssignment = async (id: string, data: any) => {
  const response = await axios.put(`${API_BASE_URL}/assignments/${id}`, data, {
    headers: getHeaders(true),
  });
  return response.data;
};

export const deleteAssignment = async (id: string) => {
  const response = await axios.delete(`${API_BASE_URL}/assignments/${id}`, {
    headers: getHeaders(true),
  });
  return response.data;
};

export const createAssignment = async (payload: {
  assetId: string;
  userId: string;
  expectedReturnDate: string;
  purpose: string;
  notes?: string;
}) => {
  const response = await axios.post(`${API_BASE_URL}/assignments`, payload, {
    headers: getHeaders(true),
  });
  return response.data;
};

export const getAssignments = async () => {
  const response = await axios.get(`${API_BASE_URL}/assignments`, {
    headers: getHeaders(true),
  });
  return response.data;
};
