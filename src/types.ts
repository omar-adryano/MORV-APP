/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  description?: string;
  invoiceNo?: string;
  attachmentName?: string;
  imageDataUrl?: string; // Linked Base64 receipt image
  paymentType?: string;   // Extracted payment type (e.g., Cash, Card)
}

export interface Budget {
  id: string;
  category: string;
  limitAmount: number;
  spentAmount: number;
  period: string; // e.g. "2026-05"
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  dueDate: string;
  category: string;
}

export interface Debt {
  id: string;
  contactName: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  type: 'to_pay' | 'to_collect'; // 'to_pay' is debt we owe to others, 'to_collect' is money others owe to us
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string;
  category: string;
  isActive: boolean;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  category: string;
  dueDate: string;
  time?: string;
}

export interface Habit {
  id: string;
  name: string;
  streak: number;
  completedToday: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  status: 'paid' | 'unpaid' | 'draft';
  taxRate: number; // percentage
  discount: number; // EGP
}

export interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface FileDoc {
  id: string;
  name: string;
  size: string; // e.g., "2.4 MB"
  mimeType: string;
  uploadDate: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
  balanceEGP: number;
  monthlySavingsGoal: number;
  salary?: number;
  currency?: string;
  theme?: 'dark' | 'light';
}

export interface ReceiptScan {
  id: string;
  vendor: string;
  amount: number;
  category: string;
  date: string;
  confidence: number;
  extractedItems?: string[];
  paymentType?: string;   // Extracted payment type
  imageDataUrl?: string; // Stored Base64 receipt image
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  isRead: boolean;
}

export interface AnalyticsHistoryRecord {
  id: string;
  timestamp: string;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  overspendingStatus: 'healthy' | 'warning' | 'critical';
  savingsPrediction: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
}
