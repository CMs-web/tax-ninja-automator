export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          gstin: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string
          gstin?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          gstin?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          type: "sales" | "purchase"
          amount: number
          gst_rate: number
          gst_amount: number
          date: string
          file_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: "sales" | "purchase"
          amount: number
          gst_rate: number
          gst_amount: number
          date: string
          file_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: "sales" | "purchase"
          amount?: number
          gst_rate?: number
          gst_amount?: number
          date?: string
          file_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      gst_returns: {
        Row: {
          id: string
          user_id: string
          gst_period: string
          sales_gst: number
          purchase_gst: number
          gst_payable: number
          status: "pending" | "submitted" | "paid"
          submitted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          gst_period: string
          sales_gst: number
          purchase_gst: number
          gst_payable: number
          status?: "pending" | "submitted" | "paid"
          submitted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          gst_period?: string
          sales_gst?: number
          purchase_gst?: number
          gst_payable?: number
          status?: "pending" | "submitted" | "paid"
          submitted_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gst_returns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          id: string
          user_id: string
          gst_return_id: string
          amount_paid: number
          payment_status: "pending" | "successful" | "failed"
          payment_gateway: string
          transaction_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          gst_return_id: string
          amount_paid: number
          payment_status?: "pending" | "successful" | "failed"
          payment_gateway: string
          transaction_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          gst_return_id?: string
          amount_paid?: number
          payment_status?: "pending" | "successful" | "failed"
          payment_gateway?: string
          transaction_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_gst_return_id_fkey"
            columns: ["gst_return_id"]
            isOneToOne: false
            referencedRelation: "gst_returns"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
