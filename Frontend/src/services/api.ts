import axios from 'axios';
import { Assignment, AssignmentFormData, QuestionPaper, ApiResponse, PaginatedResponse } from '@/types';

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return window.location.origin;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);


export const assignmentApi = {
  create: async (formData: AssignmentFormData): Promise<ApiResponse<Assignment>> => {
    const data = new FormData();
    data.append('title', formData.title);
    data.append('subject', formData.subject);
    data.append('grade', formData.grade);
    data.append('schoolName', formData.schoolName);
    data.append('dueDate', formData.dueDate);
    data.append('questionTypes', JSON.stringify(formData.questionTypes));
    data.append('additionalInstructions', formData.additionalInstructions);
    if (formData.file) {
      data.append('file', formData.file);
    }

    const res = await api.post<ApiResponse<Assignment>>('/api/assignments', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getAll: async (page = 1, limit = 20): Promise<PaginatedResponse<Assignment>> => {
    const res = await api.get<PaginatedResponse<Assignment>>(
      `/api/assignments?page=${page}&limit=${limit}`
    );
    return res.data;
  },

  getById: async (id: string): Promise<ApiResponse<Assignment>> => {
    const res = await api.get<ApiResponse<Assignment>>(`/api/assignments/${id}`);
    return res.data;
  },

  getPaper: async (id: string): Promise<ApiResponse<QuestionPaper>> => {
    const res = await api.get<ApiResponse<QuestionPaper>>(`/api/assignments/${id}/paper`);
    return res.data;
  },

  regenerate: async (id: string): Promise<ApiResponse<{ jobId: string }>> => {
    const res = await api.post<ApiResponse<{ jobId: string }>>(`/api/assignments/${id}/regenerate`);
    return res.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const res = await api.delete<ApiResponse<null>>(`/api/assignments/${id}`);
    return res.data;
  },
};

export default api;
