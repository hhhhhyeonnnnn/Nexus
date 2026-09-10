export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          author_id: string | null
          category: string
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          is_public: boolean
          organization_id: string
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_id?: string | null
          category?: string
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          is_public?: boolean
          organization_id: string
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_id?: string | null
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          is_public?: boolean
          organization_id?: string
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string
          approval_id: string
          comment: string | null
          created_at: string
          id: string
          organization_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string
          approval_id: string
          comment?: string | null
          created_at?: string
          id?: string
          organization_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string
          approval_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_logs_organization_id_approval_id_fkey"
            columns: ["organization_id", "approval_id"]
            isOneToOne: false
            referencedRelation: "approvals"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "approval_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          amount: number | null
          applicant_id: string
          content: string
          created_at: string
          current_step: number
          department_id: string | null
          id: string
          organization_id: string
          project_id: string | null
          reject_reason: string | null
          status: string
          steps: Json
          title: string
          total_steps: number
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          applicant_id: string
          content?: string
          created_at?: string
          current_step?: number
          department_id?: string | null
          id?: string
          organization_id: string
          project_id?: string | null
          reject_reason?: string | null
          status?: string
          steps?: Json
          title: string
          total_steps?: number
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          applicant_id?: string
          content?: string
          created_at?: string
          current_step?: number
          department_id?: string | null
          id?: string
          organization_id?: string
          project_id?: string | null
          reject_reason?: string | null
          status?: string
          steps?: Json
          title?: string
          total_steps?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_organization_id_department_id_fkey"
            columns: ["organization_id", "department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "approvals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_organization_id_project_id_fkey"
            columns: ["organization_id", "project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      budgets: {
        Row: {
          actual_amount: number
          category: string | null
          created_at: string
          department_id: string | null
          id: string
          organization_id: string
          planned_amount: number
          project_id: string | null
          receipt_url: string | null
          title: string
          transaction_date: string
          type: string
          vendor_id: string | null
        }
        Insert: {
          actual_amount?: number
          category?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          organization_id: string
          planned_amount?: number
          project_id?: string | null
          receipt_url?: string | null
          title: string
          transaction_date?: string
          type?: string
          vendor_id?: string | null
        }
        Update: {
          actual_amount?: number
          category?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          organization_id?: string
          planned_amount?: number
          project_id?: string | null
          receipt_url?: string | null
          title?: string
          transaction_date?: string
          type?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_department_fkey"
            columns: ["organization_id", "department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "budgets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_organization_id_project_id_fkey"
            columns: ["organization_id", "project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "budgets_organization_id_vendor_id_fkey"
            columns: ["organization_id", "vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      decisions: {
        Row: {
          content: string
          decided_at: string
          id: string
          meeting_id: string | null
          organization_id: string
          project_id: string | null
          reason: string | null
          title: string
        }
        Insert: {
          content: string
          decided_at?: string
          id?: string
          meeting_id?: string | null
          organization_id: string
          project_id?: string | null
          reason?: string | null
          title: string
        }
        Update: {
          content?: string
          decided_at?: string
          id?: string
          meeting_id?: string | null
          organization_id?: string
          project_id?: string | null
          reason?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_organization_id_meeting_id_fkey"
            columns: ["organization_id", "meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "decisions_organization_id_project_id_fkey"
            columns: ["organization_id", "project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      departments: {
        Row: {
          color: string
          created_at: string
          description: string
          id: string
          name: string
          organization_id: string
          sort_order: number
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string
          id?: string
          name: string
          organization_id: string
          sort_order?: number
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          organization_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_forms: {
        Row: {
          category: string
          created_at: string
          custom_fields: Json
          description: string
          end_at: string | null
          id: string
          max_capacity: number | null
          organization_id: string
          project_id: string | null
          start_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          custom_fields?: Json
          description?: string
          end_at?: string | null
          id?: string
          max_capacity?: number | null
          organization_id: string
          project_id?: string | null
          start_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          custom_fields?: Json
          description?: string
          end_at?: string | null
          id?: string
          max_capacity?: number | null
          organization_id?: string
          project_id?: string | null
          start_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_forms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_forms_organization_id_project_id_fkey"
            columns: ["organization_id", "project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      events: {
        Row: {
          end_at: string
          id: string
          organization_id: string
          project_id: string | null
          start_at: string
          title: string
        }
        Insert: {
          end_at: string
          id?: string
          organization_id: string
          project_id?: string | null
          start_at: string
          title: string
        }
        Update: {
          end_at?: string
          id?: string
          organization_id?: string
          project_id?: string | null
          start_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_project_id_fkey"
            columns: ["organization_id", "project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string
          external_url: string
          id: string
          organization_id: string
          project_id: string | null
          source: string
          title: string
        }
        Insert: {
          created_at?: string
          external_url: string
          id?: string
          organization_id: string
          project_id?: string | null
          source?: string
          title: string
        }
        Update: {
          created_at?: string
          external_url?: string
          id?: string
          organization_id?: string
          project_id?: string | null
          source?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_organization_id_project_id_fkey"
            columns: ["organization_id", "project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          applicant_department: string | null
          applicant_email: string | null
          applicant_name: string
          applicant_phone: string
          applicant_student_id: string | null
          checked_in: boolean
          checked_in_at: string | null
          created_at: string
          form_id: string
          group_name: string | null
          id: string
          organization_id: string
          rejection_reason: string | null
          responses: Json
          status: string
          ticket_code: string
          updated_at: string
        }
        Insert: {
          applicant_department?: string | null
          applicant_email?: string | null
          applicant_name: string
          applicant_phone: string
          applicant_student_id?: string | null
          checked_in?: boolean
          checked_in_at?: string | null
          created_at?: string
          form_id: string
          group_name?: string | null
          id?: string
          organization_id: string
          rejection_reason?: string | null
          responses?: Json
          status?: string
          ticket_code: string
          updated_at?: string
        }
        Update: {
          applicant_department?: string | null
          applicant_email?: string | null
          applicant_name?: string
          applicant_phone?: string
          applicant_student_id?: string | null
          checked_in?: boolean
          checked_in_at?: string | null
          created_at?: string
          form_id?: string
          group_name?: string | null
          id?: string
          organization_id?: string
          rejection_reason?: string | null
          responses?: Json
          status?: string
          ticket_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_organization_id_form_id_fkey"
            columns: ["organization_id", "form_id"]
            isOneToOne: false
            referencedRelation: "event_forms"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      meetings: {
        Row: {
          ai_summary: string | null
          attendees: string | null
          content: string
          created_at: string
          id: string
          meeting_date: string
          organization_id: string
          project_id: string | null
          title: string
        }
        Insert: {
          ai_summary?: string | null
          attendees?: string | null
          content?: string
          created_at?: string
          id?: string
          meeting_date: string
          organization_id: string
          project_id?: string | null
          title: string
        }
        Update: {
          ai_summary?: string | null
          attendees?: string | null
          content?: string
          created_at?: string
          id?: string
          meeting_date?: string
          organization_id?: string
          project_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_organization_id_project_id_fkey"
            columns: ["organization_id", "project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link_url: string | null
          message: string
          organization_id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link_url?: string | null
          message: string
          organization_id: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link_url?: string | null
          message?: string
          organization_id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_creation_requests: {
        Row: {
          created_at: string
          id: string
          org_name: string
          reason: string
          requester_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          university_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_name: string
          reason?: string
          requester_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          university_name: string
        }
        Update: {
          created_at?: string
          id?: string
          org_name?: string
          reason?: string
          requester_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          university_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_creation_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_creation_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_join_requests: {
        Row: {
          created_at: string
          id: string
          message: string
          organization_id: string
          requester_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string
          organization_id: string
          requester_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          organization_id?: string
          requester_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_join_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_join_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_join_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          department_id: string | null
          job_title: string | null
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          user_id: string
        }
        Insert: {
          department_id?: string | null
          job_title?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["organization_role"]
          user_id: string
        }
        Update: {
          department_id?: string | null
          job_title?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_department_fkey"
            columns: ["organization_id", "department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          university_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          university_name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          university_name?: string
        }
        Relationships: []
      }
      petitions: {
        Row: {
          answered_at: string | null
          author_name: string
          content: string
          created_at: string
          id: string
          is_secret: boolean
          official_answer: string | null
          organization_id: string
          status: string
          student_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          answered_at?: string | null
          author_name?: string
          content: string
          created_at?: string
          id?: string
          is_secret?: boolean
          official_answer?: string | null
          organization_id: string
          status?: string
          student_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          answered_at?: string | null
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          is_secret?: boolean
          official_answer?: string | null
          organization_id?: string
          status?: string
          student_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "petitions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          poll_id: string
          selected_option_id: string
          voter_identifier: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          poll_id: string
          selected_option_id: string
          voter_identifier: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          poll_id?: string
          selected_option_id?: string
          voter_identifier?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_organization_id_poll_id_fkey"
            columns: ["organization_id", "poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string
          description: string
          expires_at: string | null
          id: string
          is_closed: boolean
          options: Json
          organization_id: string
          title: string
          total_votes: number
        }
        Insert: {
          created_at?: string
          description?: string
          expires_at?: string | null
          id?: string
          is_closed?: boolean
          options?: Json
          organization_id: string
          title: string
          total_votes?: number
        }
        Update: {
          created_at?: string
          description?: string
          expires_at?: string | null
          id?: string
          is_closed?: boolean
          options?: Json
          organization_id?: string
          title?: string
          total_votes?: number
        }
        Relationships: [
          {
            foreignKeyName: "polls_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          is_site_admin: boolean
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          is_site_admin?: boolean
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_site_admin?: boolean
          name?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string
          end_date: string | null
          id: string
          name: string
          organization_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
        }
        Insert: {
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          name: string
          organization_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
        }
        Update: {
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          name?: string
          organization_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          department_id: string | null
          description: string
          due_date: string | null
          id: string
          organization_id: string
          project_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          department_id?: string | null
          description?: string
          due_date?: string | null
          id?: string
          organization_id: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          department_id?: string | null
          description?: string
          due_date?: string | null
          id?: string
          organization_id?: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_department_fkey"
            columns: ["organization_id", "department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "tasks_organization_id_assignee_id_fkey"
            columns: ["organization_id", "assignee_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "user_id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_project_id_fkey"
            columns: ["organization_id", "project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      vendors: {
        Row: {
          category: string | null
          contact_name: string | null
          created_at: string
          id: string
          memo: string
          name: string
          organization_id: string
          phone: string | null
          rating: number | null
        }
        Insert: {
          category?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          memo?: string
          name: string
          organization_id: string
          phone?: string | null
          rating?: number | null
        }
        Update: {
          category?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          memo?: string
          name?: string
          organization_id?: string
          phone?: string | null
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      organization_role: "PRESIDENT" | "VICE_PRESIDENT" | "ADMIN" | "MEMBER"
      project_status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED"
      task_status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      organization_role: ["PRESIDENT", "VICE_PRESIDENT", "ADMIN", "MEMBER"],
      project_status: ["PLANNED", "IN_PROGRESS", "COMPLETED", "ARCHIVED"],
      task_status: ["TODO", "IN_PROGRESS", "REVIEW", "DONE"],
    },
  },
} as const
