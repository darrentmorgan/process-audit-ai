import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// Hook for saving and loading audit reports
export const useAuditReports = () => {
  const { user, isConfigured } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)

  // Load user's audit reports
  const loadReports = useCallback(async () => {
    if (!isConfigured || !user) {
      console.log('useAuditReports: Cannot load reports - not configured or no user')
      return
    }

    console.log('useAuditReports: Loading reports for user:', user.id)
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('audit_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      console.log('useAuditReports: Loaded reports:', data?.length || 0)
      setReports(data || [])
    } catch (error) {
      console.error('useAuditReports: Error loading reports:', error)
      setReports([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }, [isConfigured, user])

  // Save a new audit report
  const saveReport = useCallback(async (reportData) => {
    if (!isConfigured || !user) {
      throw new Error('Authentication required to save reports')
    }

    console.log('useAuditReports: Saving report:', reportData.title)
    try {
      const { data, error } = await supabase
        .from('audit_reports')
        .insert([
          {
            user_id: user.id,
            title: reportData.title || 'Process Audit Report',
            process_description: reportData.processDescription,
            file_content: reportData.fileContent,
            answers: reportData.answers,
            report_data: reportData.report,
            created_at: new Date().toISOString()
          }
        ])
        .select()

      if (error) throw error
      
      // Add to local state
      if (data && data[0]) {
        setReports(prev => [data[0], ...prev])
      }
      
      console.log('useAuditReports: Report saved successfully:', data[0]?.id)
      return { data: data[0], error: null }
    } catch (error) {
      console.error('useAuditReports: Error saving report:', error)
      return { data: null, error }
    }
  }, [isConfigured, user])

  // Delete a report
  const deleteReport = async (reportId) => {
    if (!isConfigured || !user) return

    try {
      const { error } = await supabase
        .from('audit_reports')
        .delete()
        .eq('id', reportId)
        .eq('user_id', user.id) // Ensure user can only delete their own reports

      if (error) throw error
      
      // Remove from local state
      setReports(prev => prev.filter(report => report.id !== reportId))
      return { error: null }
    } catch (error) {
      console.error('Error deleting report:', error)
      return { error }
    }
  }

  // Load reports when user changes
  useEffect(() => {
    if (user && isConfigured) {
      loadReports()
    } else {
      setReports([])
    }
  }, [user, isConfigured])

  return {
    reports,
    loading,
    saveReport,
    deleteReport,
    loadReports
  }
}

// Hook for managing user profile
export const useProfile = () => {
  const { user, updateProfile, isConfigured } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadProfile = async () => {
    if (!isConfigured || !user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error
      }
      
      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUserProfile = async (updates) => {
    if (!isConfigured || !user) return

    try {
      // Update auth metadata
      const { error: authError } = await updateProfile(updates)
      if (authError) throw authError

      // Update profile table
      const { data, error } = await supabase
        .from('profiles')
        .upsert([
          {
            id: user.id,
            ...updates,
            updated_at: new Date().toISOString()
          }
        ])
        .select()

      if (error) throw error
      
      if (data && data[0]) {
        setProfile(data[0])
      }
      
      return { data: data[0], error: null }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { data: null, error }
    }
  }

  useEffect(() => {
    if (user && isConfigured) {
      loadProfile()
    } else {
      setProfile(null)
    }
  }, [user, isConfigured])

  return {
    profile,
    loading,
    updateUserProfile,
    loadProfile
  }
}