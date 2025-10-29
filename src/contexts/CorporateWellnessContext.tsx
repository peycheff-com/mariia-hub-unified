// Corporate Wellness Context
// Manages state for B2B corporate wellness platform

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

import { supabase } from '@/integrations/supabase/client';
import {
  CorporateAccount,
  CorporateDepartment,
  CorporateEmployee,
  CorporateBudget,
  CorporateWellnessProgram,
  ProgramEnrollment,
  B2BPartner,
  CorporateAnalytics,
  DepartmentPerformance,
  BudgetAlert,
  CorporateDashboard
} from '@/types/corporate';

// =============================================
// ACTION TYPES
// =============================================

type CorporateAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CURRENT_ACCOUNT'; payload: CorporateAccount | null }
  | { type: 'SET_DEPARTMENTS'; payload: CorporateDepartment[] }
  | { type: 'ADD_DEPARTMENT'; payload: CorporateDepartment }
  | { type: 'UPDATE_DEPARTMENT'; payload: { id: string; updates: Partial<CorporateDepartment> } }
  | { type: 'DELETE_DEPARTMENT'; payload: string }
  | { type: 'SET_EMPLOYEES'; payload: CorporateEmployee[] }
  | { type: 'ADD_EMPLOYEE'; payload: CorporateEmployee }
  | { type: 'UPDATE_EMPLOYEE'; payload: { id: string; updates: Partial<CorporateEmployee> } }
  | { type: 'DELETE_EMPLOYEE'; payload: string }
  | { type: 'SET_BUDGETS'; payload: CorporateBudget[] }
  | { type: 'ADD_BUDGET'; payload: CorporateBudget }
  | { type: 'UPDATE_BUDGET'; payload: { id: string; updates: Partial<CorporateBudget> } }
  | { type: 'SET_PROGRAMS'; payload: CorporateWellnessProgram[] }
  | { type: 'ADD_PROGRAM'; payload: CorporateWellnessProgram }
  | { type: 'UPDATE_PROGRAM'; payload: { id: string; updates: Partial<CorporateWellnessProgram> } }
  | { type: 'DELETE_PROGRAM'; payload: string }
  | { type: 'SET_ENROLLMENTS'; payload: ProgramEnrollment[] }
  | { type: 'ADD_ENROLLMENT'; payload: ProgramEnrollment }
  | { type: 'UPDATE_ENROLLMENT'; payload: { id: string; updates: Partial<ProgramEnrollment> } }
  | { type: 'SET_PARTNERS'; payload: B2BPartner[] }
  | { type: 'ADD_PARTNER'; payload: B2BPartner }
  | { type: 'UPDATE_PARTNER'; payload: { id: string; updates: Partial<B2BPartner> } }
  | { type: 'DELETE_PARTNER'; payload: string }
  | { type: 'SET_ANALYTICS'; payload: CorporateAnalytics[] }
  | { type: 'SET_DASHBOARD'; payload: CorporateDashboard | null }
  | { type: 'SET_BUDGET_ALERTS'; payload: BudgetAlert[] }
  | { type: 'CLEAR_DATA' };

// =============================================
// STATE INTERFACE
// =============================================

interface CorporateState {
  loading: boolean;
  error: string | null;

  // Current corporate account
  currentAccount: CorporateAccount | null;

  // Organizational data
  departments: CorporateDepartment[];
  employees: CorporateEmployee[];

  // Financial data
  budgets: CorporateBudget[];
  budgetAlerts: BudgetAlert[];

  // Wellness programs
  programs: CorporateWellnessProgram[];
  enrollments: ProgramEnrollment[];

  // Partners
  partners: B2BPartner[];

  // Analytics
  analytics: CorporateAnalytics[];
  dashboard: CorporateDashboard | null;
}

// =============================================
// INITIAL STATE
// =============================================

const initialState: CorporateState = {
  loading: false,
  error: null,
  currentAccount: null,
  departments: [],
  employees: [],
  budgets: [],
  budgetAlerts: [],
  programs: [],
  enrollments: [],
  partners: [],
  analytics: [],
  dashboard: null
};

// =============================================
// REDUCER
// =============================================

const corporateReducer = (state: CorporateState, action: CorporateAction): CorporateState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'SET_CURRENT_ACCOUNT':
      return { ...state, currentAccount: action.payload };

    case 'SET_DEPARTMENTS':
      return { ...state, departments: action.payload };

    case 'ADD_DEPARTMENT':
      return { ...state, departments: [...state.departments, action.payload] };

    case 'UPDATE_DEPARTMENT':
      return {
        ...state,
        departments: state.departments.map(dept =>
          dept.id === action.payload.id ? { ...dept, ...action.payload.updates } : dept
        )
      };

    case 'DELETE_DEPARTMENT':
      return {
        ...state,
        departments: state.departments.filter(dept => dept.id !== action.payload)
      };

    case 'SET_EMPLOYEES':
      return { ...state, employees: action.payload };

    case 'ADD_EMPLOYEE':
      return { ...state, employees: [...state.employees, action.payload] };

    case 'UPDATE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.map(emp =>
          emp.id === action.payload.id ? { ...emp, ...action.payload.updates } : emp
        )
      };

    case 'DELETE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.filter(emp => emp.id !== action.payload)
      };

    case 'SET_BUDGETS':
      return { ...state, budgets: action.payload };

    case 'ADD_BUDGET':
      return { ...state, budgets: [...state.budgets, action.payload] };

    case 'UPDATE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.map(budget =>
          budget.id === action.payload.id ? { ...budget, ...action.payload.updates } : budget
        )
      };

    case 'SET_PROGRAMS':
      return { ...state, programs: action.payload };

    case 'ADD_PROGRAM':
      return { ...state, programs: [...state.programs, action.payload] };

    case 'UPDATE_PROGRAM':
      return {
        ...state,
        programs: state.programs.map(program =>
          program.id === action.payload.id ? { ...program, ...action.payload.updates } : program
        )
      };

    case 'DELETE_PROGRAM':
      return {
        ...state,
        programs: state.programs.filter(program => program.id !== action.payload)
      };

    case 'SET_ENROLLMENTS':
      return { ...state, enrollments: action.payload };

    case 'ADD_ENROLLMENT':
      return { ...state, enrollments: [...state.enrollments, action.payload] };

    case 'UPDATE_ENROLLMENT':
      return {
        ...state,
        enrollments: state.enrollments.map(enrollment =>
          enrollment.id === action.payload.id ? { ...enrollment, ...action.payload.updates } : enrollment
        )
      };

    case 'SET_PARTNERS':
      return { ...state, partners: action.payload };

    case 'ADD_PARTNER':
      return { ...state, partners: [...state.partners, action.payload] };

    case 'UPDATE_PARTNER':
      return {
        ...state,
        partners: state.partners.map(partner =>
          partner.id === action.payload.id ? { ...partner, ...action.payload.updates } : partner
        )
      };

    case 'DELETE_PARTNER':
      return {
        ...state,
        partners: state.partners.filter(partner => partner.id !== action.payload)
      };

    case 'SET_ANALYTICS':
      return { ...state, analytics: action.payload };

    case 'SET_DASHBOARD':
      return { ...state, dashboard: action.payload };

    case 'SET_BUDGET_ALERTS':
      return { ...state, budgetAlerts: action.payload };

    case 'CLEAR_DATA':
      return initialState;

    default:
      return state;
  }
};

// =============================================
// CONTEXT TYPE
// =============================================

interface CorporateContextType extends CorporateState {
  // Account management
  loadCorporateAccount: (accountId: string) => Promise<void>;
  createCorporateAccount: (data: any) => Promise<CorporateAccount>;
  updateCorporateAccount: (accountId: string, updates: any) => Promise<void>;

  // Department management
  loadDepartments: (accountId: string) => Promise<void>;
  createDepartment: (data: any) => Promise<CorporateDepartment>;
  updateDepartment: (departmentId: string, updates: any) => Promise<void>;
  deleteDepartment: (departmentId: string) => Promise<void>;

  // Employee management
  loadEmployees: (accountId: string) => Promise<void>;
  createEmployee: (data: any) => Promise<CorporateEmployee>;
  updateEmployee: (employeeId: string, updates: any) => Promise<void>;
  deleteEmployee: (employeeId: string) => Promise<void>;
  bulkUploadEmployees: (data: any) => Promise<CorporateEmployee[]>;

  // Budget management
  loadBudgets: (accountId: string) => Promise<void>;
  createBudget: (data: any) => Promise<CorporateBudget>;
  updateBudget: (budgetId: string, updates: any) => Promise<void>;

  // Program management
  loadPrograms: (accountId: string) => Promise<void>;
  createProgram: (data: any) => Promise<CorporateWellnessProgram>;
  updateProgram: (programId: string, updates: any) => Promise<void>;
  deleteProgram: (programId: string) => Promise<void>;

  // Enrollment management
  loadEnrollments: (filters?: any) => Promise<void>;
  enrollEmployee: (programId: string, employeeId: string) => Promise<ProgramEnrollment>;
  updateEnrollment: (enrollmentId: string, updates: any) => Promise<void>;

  // Partner management
  loadPartners: () => Promise<void>;
  createPartner: (data: any) => Promise<B2BPartner>;
  updatePartner: (partnerId: string, updates: any) => Promise<void>;
  deletePartner: (partnerId: string) => Promise<void>;

  // Analytics
  loadAnalytics: (accountId: string, filters: any) => Promise<void>;
  loadDashboard: (accountId: string) => Promise<void>;
  generateReport: (data: any) => Promise<string>;

  // Utility functions
  refresh: () => Promise<void>;
  clearError: () => void;
}

// =============================================
// CONTEXT
// =============================================

const CorporateContext = createContext<CorporateContextType | undefined>(undefined);

// =============================================
// PROVIDER
// =============================================

interface CorporateProviderProps {
  children: ReactNode;
}

export const CorporateProvider: React.FC<CorporateProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(corporateReducer, initialState);

  // Utility function to handle errors
  const handleError = (error: any, message: string) => {
    console.error(message, error);
    dispatch({ type: 'SET_ERROR', payload: error.message || message });
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  // =============================================
  // ACCOUNT MANAGEMENT
  // =============================================

  const loadCorporateAccount = async (accountId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const { data, error } = await supabase
        .from('corporate_accounts')
        .select(`
          *,
          account_manager:profiles(
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq('id', accountId)
        .single();

      if (error) throw error;

      dispatch({ type: 'SET_CURRENT_ACCOUNT', payload: data });
    } catch (error) {
      handleError(error, 'Failed to load corporate account');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createCorporateAccount = async (data: any): Promise<CorporateAccount> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const { data: account, error } = await supabase
        .from('corporate_accounts')
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'SET_CURRENT_ACCOUNT', payload: account });
      return account;
    } catch (error) {
      handleError(error, 'Failed to create corporate account');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateCorporateAccount = async (accountId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('corporate_accounts')
        .update(updates)
        .eq('id', accountId)
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'SET_CURRENT_ACCOUNT', payload: data });
    } catch (error) {
      handleError(error, 'Failed to update corporate account');
    }
  };

  // =============================================
  // DEPARTMENT MANAGEMENT
  // =============================================

  const loadDepartments = async (accountId: string) => {
    try {
      const { data, error } = await supabase
        .from('corporate_departments')
        .select(`
          *,
          manager:profiles(
            id,
            first_name,
            last_name,
            email
          ),
          parent_department:corporate_departments(
            id,
            department_name
          ),
          employees:corporate_employees(
            id,
            first_name,
            last_name,
            is_active
          )
        `)
        .eq('corporate_account_id', accountId)
        .order('department_name');

      if (error) throw error;

      dispatch({ type: 'SET_DEPARTMENTS', payload: data || [] });
    } catch (error) {
      handleError(error, 'Failed to load departments');
    }
  };

  const createDepartment = async (data: any): Promise<CorporateDepartment> => {
    try {
      const { data: department, error } = await supabase
        .from('corporate_departments')
        .insert(data)
        .select(`
          *,
          manager:profiles(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .single();

      if (error) throw error;

      dispatch({ type: 'ADD_DEPARTMENT', payload: department });
      return department;
    } catch (error) {
      handleError(error, 'Failed to create department');
      throw error;
    }
  };

  const updateDepartment = async (departmentId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('corporate_departments')
        .update(updates)
        .eq('id', departmentId)
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'UPDATE_DEPARTMENT', payload: { id: departmentId, updates: data } });
    } catch (error) {
      handleError(error, 'Failed to update department');
    }
  };

  const deleteDepartment = async (departmentId: string) => {
    try {
      const { error } = await supabase
        .from('corporate_departments')
        .delete()
        .eq('id', departmentId);

      if (error) throw error;

      dispatch({ type: 'DELETE_DEPARTMENT', payload: departmentId });
    } catch (error) {
      handleError(error, 'Failed to delete department');
    }
  };

  // =============================================
  // EMPLOYEE MANAGEMENT
  // =============================================

  const loadEmployees = async (accountId: string) => {
    try {
      const { data, error } = await supabase
        .from('corporate_employees')
        .select(`
          *,
          user:profiles(
            id,
            first_name,
            last_name,
            email,
            avatar_url
          ),
          department:corporate_departments(
            id,
            department_name
          ),
          manager:corporate_employees(
            id,
            first_name,
            last_name
          )
        `)
        .eq('corporate_account_id', accountId)
        .order('last_name');

      if (error) throw error;

      dispatch({ type: 'SET_EMPLOYEES', payload: data || [] });
    } catch (error) {
      handleError(error, 'Failed to load employees');
    }
  };

  const createEmployee = async (data: any): Promise<CorporateEmployee> => {
    try {
      const { data: employee, error } = await supabase
        .from('corporate_employees')
        .insert(data)
        .select(`
          *,
          department:corporate_departments(
            id,
            department_name
          )
        `)
        .single();

      if (error) throw error;

      dispatch({ type: 'ADD_EMPLOYEE', payload: employee });
      return employee;
    } catch (error) {
      handleError(error, 'Failed to create employee');
      throw error;
    }
  };

  const updateEmployee = async (employeeId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('corporate_employees')
        .update(updates)
        .eq('id', employeeId)
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'UPDATE_EMPLOYEE', payload: { id: employeeId, updates: data } });
    } catch (error) {
      handleError(error, 'Failed to update employee');
    }
  };

  const deleteEmployee = async (employeeId: string) => {
    try {
      const { error } = await supabase
        .from('corporate_employees')
        .delete()
        .eq('id', employeeId);

      if (error) throw error;

      dispatch({ type: 'DELETE_EMPLOYEE', payload: employeeId });
    } catch (error) {
      handleError(error, 'Failed to delete employee');
    }
  };

  const bulkUploadEmployees = async (data: any): Promise<CorporateEmployee[]> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const { data: employees, error } = await supabase
        .from('corporate_employees')
        .insert(data.employees)
        .select();

      if (error) throw error;

      // Update state with new employees
      if (employees) {
        employees.forEach(employee => {
          dispatch({ type: 'ADD_EMPLOYEE', payload: employee });
        });
      }

      return employees || [];
    } catch (error) {
      handleError(error, 'Failed to bulk upload employees');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // =============================================
  // BUDGET MANAGEMENT
  // =============================================

  const loadBudgets = async (accountId: string) => {
    try {
      const { data, error } = await supabase
        .from('corporate_budgets')
        .select(`
          *,
          department:corporate_departments(
            id,
            department_name
          ),
          approved_by:profiles(
            id,
            first_name,
            last_name
          ),
          transactions:budget_transactions(
            id,
            transaction_type,
            amount,
            description,
            transaction_date
          )
        `)
        .eq('corporate_account_id', accountId)
        .order('budget_period', { ascending: false });

      if (error) throw error;

      dispatch({ type: 'SET_BUDGETS', payload: data || [] });
    } catch (error) {
      handleError(error, 'Failed to load budgets');
    }
  };

  const createBudget = async (data: any): Promise<CorporateBudget> => {
    try {
      const { data: budget, error } = await supabase
        .from('corporate_budgets')
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'ADD_BUDGET', payload: budget });
      return budget;
    } catch (error) {
      handleError(error, 'Failed to create budget');
      throw error;
    }
  };

  const updateBudget = async (budgetId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('corporate_budgets')
        .update(updates)
        .eq('id', budgetId)
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'UPDATE_BUDGET', payload: { id: budgetId, updates: data } });
    } catch (error) {
      handleError(error, 'Failed to update budget');
    }
  };

  // =============================================
  // PROGRAM MANAGEMENT
  // =============================================

  const loadPrograms = async (accountId: string) => {
    try {
      const { data, error } = await supabase
        .from('corporate_wellness_programs')
        .select(`
          *,
          created_by:profiles(
            id,
            first_name,
            last_name
          )
        `)
        .eq('corporate_account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      dispatch({ type: 'SET_PROGRAMS', payload: data || [] });
    } catch (error) {
      handleError(error, 'Failed to load wellness programs');
    }
  };

  const createProgram = async (data: any): Promise<CorporateWellnessProgram> => {
    try {
      const { data: program, error } = await supabase
        .from('corporate_wellness_programs')
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'ADD_PROGRAM', payload: program });
      return program;
    } catch (error) {
      handleError(error, 'Failed to create wellness program');
      throw error;
    }
  };

  const updateProgram = async (programId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('corporate_wellness_programs')
        .update(updates)
        .eq('id', programId)
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'UPDATE_PROGRAM', payload: { id: programId, updates: data } });
    } catch (error) {
      handleError(error, 'Failed to update wellness program');
    }
  };

  const deleteProgram = async (programId: string) => {
    try {
      const { error } = await supabase
        .from('corporate_wellness_programs')
        .delete()
        .eq('id', programId);

      if (error) throw error;

      dispatch({ type: 'DELETE_PROGRAM', payload: programId });
    } catch (error) {
      handleError(error, 'Failed to delete wellness program');
    }
  };

  // =============================================
  // ENROLLMENT MANAGEMENT
  // =============================================

  const loadEnrollments = async (filters: any = {}) => {
    try {
      let query = supabase
        .from('program_enrollments')
        .select(`
          *,
          program:corporate_wellness_programs(
            id,
            program_name,
            program_type,
            start_date,
            end_date
          ),
          employee:corporate_employees(
            id,
            first_name,
            last_name,
            email
          )
        `);

      // Apply filters
      if (filters.program_id) {
        query = query.eq('program_id', filters.program_id);
      }
      if (filters.employee_id) {
        query = query.eq('employee_id', filters.employee_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('enrollment_date', { ascending: false });

      if (error) throw error;

      dispatch({ type: 'SET_ENROLLMENTS', payload: data || [] });
    } catch (error) {
      handleError(error, 'Failed to load enrollments');
    }
  };

  const enrollEmployee = async (programId: string, employeeId: string): Promise<ProgramEnrollment> => {
    try {
      const { data: enrollment, error } = await supabase
        .from('program_enrollments')
        .insert({
          program_id: programId,
          employee_id: employeeId,
          status: 'enrolled'
        })
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'ADD_ENROLLMENT', payload: enrollment });
      return enrollment;
    } catch (error) {
      handleError(error, 'Failed to enroll employee');
      throw error;
    }
  };

  const updateEnrollment = async (enrollmentId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('program_enrollments')
        .update(updates)
        .eq('id', enrollmentId)
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'UPDATE_ENROLLMENT', payload: { id: enrollmentId, updates: data } });
    } catch (error) {
      handleError(error, 'Failed to update enrollment');
    }
  };

  // =============================================
  // PARTNER MANAGEMENT
  // =============================================

  const loadPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('b2b_partners')
        .select(`
          *,
          service_mappings:partner_service_mappings(
            id,
            service_name,
            corporate_rate,
            status
          )
        `)
        .order('partner_name');

      if (error) throw error;

      dispatch({ type: 'SET_PARTNERS', payload: data || [] });
    } catch (error) {
      handleError(error, 'Failed to load partners');
    }
  };

  const createPartner = async (data: any): Promise<B2BPartner> => {
    try {
      const { data: partner, error } = await supabase
        .from('b2b_partners')
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'ADD_PARTNER', payload: partner });
      return partner;
    } catch (error) {
      handleError(error, 'Failed to create partner');
      throw error;
    }
  };

  const updatePartner = async (partnerId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('b2b_partners')
        .update(updates)
        .eq('id', partnerId)
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'UPDATE_PARTNER', payload: { id: partnerId, updates: data } });
    } catch (error) {
      handleError(error, 'Failed to update partner');
    }
  };

  const deletePartner = async (partnerId: string) => {
    try {
      const { error } = await supabase
        .from('b2b_partners')
        .delete()
        .eq('id', partnerId);

      if (error) throw error;

      dispatch({ type: 'DELETE_PARTNER', payload: partnerId });
    } catch (error) {
      handleError(error, 'Failed to delete partner');
    }
  };

  // =============================================
  // ANALYTICS
  // =============================================

  const loadAnalytics = async (accountId: string, filters: any) => {
    try {
      let query = supabase
        .from('corporate_analytics')
        .select(`
          *,
          department:corporate_departments(
            id,
            department_name
          )
        `)
        .eq('corporate_account_id', accountId);

      // Apply filters
      if (filters.date_from) {
        query = query.gte('analytics_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('analytics_date', filters.date_to);
      }
      if (filters.period_type) {
        query = query.eq('period_type', filters.period_type);
      }

      const { data, error } = await query.order('analytics_date', { ascending: false });

      if (error) throw error;

      dispatch({ type: 'SET_ANALYTICS', payload: data || [] });
    } catch (error) {
      handleError(error, 'Failed to load analytics');
    }
  };

  const loadDashboard = async (accountId: string) => {
    try {
      const { data, error } = await supabase
        .from('corporate_dashboard_view')
        .select('*')
        .eq('corporate_id', accountId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Load additional dashboard data
      const [budgetAlerts, departmentPerformance] = await Promise.all([
        supabase
          .from('budget_transactions')
          .select('*')
          .eq('budget_id', accountId)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

        supabase
          .from('department_performance_view')
          .select('*')
          .eq('department_id', accountId)
      ]);

      dispatch({ type: 'SET_DASHBOARD', payload: data });
      dispatch({ type: 'SET_BUDGET_ALERTS', payload: budgetAlerts.data || [] });
    } catch (error) {
      handleError(error, 'Failed to load dashboard');
    }
  };

  const generateReport = async (data: any): Promise<string> => {
    try {
      // Call edge function to generate report
      const { data: reportUrl, error } = await supabase.functions.invoke('generate-corporate-report', {
        body: data
      });

      if (error) throw error;

      return reportUrl.url;
    } catch (error) {
      handleError(error, 'Failed to generate report');
      throw error;
    }
  };

  // =============================================
  // UTILITY FUNCTIONS
  // =============================================

  const refresh = async () => {
    if (state.currentAccount) {
      await Promise.all([
        loadDepartments(state.currentAccount.id),
        loadEmployees(state.currentAccount.id),
        loadBudgets(state.currentAccount.id),
        loadPrograms(state.currentAccount.id),
        loadDashboard(state.currentAccount.id)
      ]);
    }
  };

  // Load initial data if user is part of corporate account
  useEffect(() => {
    const loadInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check if user is associated with corporate account
        const { data: employee } = await supabase
          .from('corporate_employees')
          .select('corporate_account_id')
          .eq('user_id', user.id)
          .single();

        if (employee) {
          await loadCorporateAccount(employee.corporate_account_id);
        }
      }
    };

    loadInitialData();
  }, []);

  const value: CorporateContextType = {
    ...state,
    // Account
    loadCorporateAccount,
    createCorporateAccount,
    updateCorporateAccount,

    // Departments
    loadDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,

    // Employees
    loadEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    bulkUploadEmployees,

    // Budgets
    loadBudgets,
    createBudget,
    updateBudget,

    // Programs
    loadPrograms,
    createProgram,
    updateProgram,
    deleteProgram,

    // Enrollments
    loadEnrollments,
    enrollEmployee,
    updateEnrollment,

    // Partners
    loadPartners,
    createPartner,
    updatePartner,
    deletePartner,

    // Analytics
    loadAnalytics,
    loadDashboard,
    generateReport,

    // Utilities
    refresh,
    clearError
  };

  return (
    <CorporateContext.Provider value={value}>
      {children}
    </CorporateContext.Provider>
  );
};

// =============================================
// HOOK
// =============================================

export const useCorporate = () => {
  const context = useContext(CorporateContext);
  if (context === undefined) {
    throw new Error('useCorporate must be used within a CorporateProvider');
  }
  return context;
};