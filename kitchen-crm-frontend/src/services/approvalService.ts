/**
 * Approval Service
 * Handles API calls for document signature/approval
 */

import axios from 'axios';
import type { DocumentDetails, ApprovalRequest, ApprovalResponse } from '../types/signature.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const PUBLIC_API_BASE_URL = import.meta.env.VITE_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// Create axios instance with authentication
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Public (no-auth) axios instance for customer-facing endpoints
const publicClient = axios.create({
  baseURL: PUBLIC_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

class ApprovalService {
  /**
   * Get document details by token (Public API)
   */
  async getDocumentByToken(token: string): Promise<DocumentDetails> {
    const response = await publicClient.get(`/api/public/documents/sign/${token}`);
    return response.data?.data ?? response.data;
  }

  /**
   * Submit approval (Public API)
   */
  async submitApproval(token: string, approvalData: ApprovalRequest): Promise<ApprovalResponse> {
    const response = await publicClient.post(
      `/api/public/documents/sign/${token}`,
      approvalData
    );
    return response.data;
  }

  /**
   * Get client IP address
   */
  async getClientIP(): Promise<string> {
    try {
      const response = await axios.get('https://api.ipify.org?format=json');
      return response.data.ip;
    } catch (error) {
      console.error('Failed to get IP address:', error);
      return 'unknown';
    }
  }

  /**
   * Send quotation for signature (Admin API)
   */
  async sendForSignature(quotationId: number): Promise<any> {
    console.log('approvalService.sendForSignature called with:', quotationId);
    console.log('API endpoint:', `/signatures/quotations/${quotationId}/send-for-signature`);
    
    try {
      const response = await apiClient.post(
        `/signatures/quotations/${quotationId}/send-for-signature`
      );
      console.log('API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API error in sendForSignature:', error);
      throw error;
    }
  }

  /**
   * Get signed documents for a quotation (Admin API)
   */
  async getSignedDocuments(quotationId: number): Promise<any[]> {
    console.log('approvalService.getSignedDocuments called with:', quotationId);
    console.log('API endpoint:', `/signatures/quotations/${quotationId}/documents`);
    
    try {
      const response = await apiClient.get(`/signatures/quotations/${quotationId}/documents`);
      console.log('API response:', response.data);
      
      // Handle different response structures
      const documents = response.data?.data || response.data || [];
      console.log('Extracted documents:', documents);
      
      return Array.isArray(documents) ? documents : [];
    } catch (error) {
      console.error('API error in getSignedDocuments:', error);
      throw error;
    }
  }

  /**
   * Download signed document (Admin API)
   */
  async downloadDocument(documentId: number): Promise<Blob> {
    const response = await apiClient.get(`/signatures/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Resend signature request notification
   */
  async resendNotification(documentId: number): Promise<any> {
    const response = await apiClient.post(
      `/signatures/documents/${documentId}/resend-notification`
    );
    return response.data;
  }
}

export const approvalService = new ApprovalService();
export default approvalService;
