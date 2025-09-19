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
          email: string
          name: string | null
          avatar_url: string | null
          is_suspended: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          avatar_url?: string | null
          is_suspended?: boolean
          created_at?: string
          updated_at: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          is_suspended?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string
          domain: string | null
          plan: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          max_links: number
          max_clicks: number
          max_users: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          domain?: string | null
          plan?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          max_links?: number
          max_clicks?: number
          max_users?: number
          created_at?: string
          updated_at: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          domain?: string | null
          plan?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          max_links?: number
          max_clicks?: number
          max_users?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workspace_memberships: {
        Row: {
          id: string
          user_id: string
          workspace_id: string
          role: string
          joined_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workspace_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string
          role?: string
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_memberships_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_memberships_workspace_id_fkey"
            columns: ["workspace_id"]
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          }
        ]
      }
      folders: {
        Row: {
          id: string
          workspace_id: string
          name: string
          parent_id: string | null
          level: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          parent_id?: string | null
          level?: number
          created_at?: string
          updated_at: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          parent_id?: string | null
          level?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_workspace_id_fkey"
            columns: ["workspace_id"]
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_parent_id_fkey"
            columns: ["parent_id"]
            referencedRelation: "folders"
            referencedColumns: ["id"]
          }
        ]
      }
      campaigns: {
        Row: {
          id: string
          workspace_id: string
          name: string
          description: string | null
          start_date: string | null
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_workspace_id_fkey"
            columns: ["workspace_id"]
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          }
        ]
      }
      links: {
        Row: {
          id: string
          workspace_id: string
          folder_id: string | null
          campaign_id: string | null
          slug: string
          url: string
          title: string | null
          description: string | null
          image: string | null
          favicon: string | null
          password: string | null
          expires_at: string | null
          is_active: boolean
          click_limit: number | null
          click_count: number
          last_clicked_at: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_term: string | null
          utm_content: string | null
          ios_url: string | null
          android_url: string | null
          enable_geolocation: boolean
          enable_device_targeting: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          folder_id?: string | null
          campaign_id?: string | null
          slug: string
          url: string
          title?: string | null
          description?: string | null
          image?: string | null
          favicon?: string | null
          password?: string | null
          expires_at?: string | null
          is_active?: boolean
          click_limit?: number | null
          click_count?: number
          last_clicked_at?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_term?: string | null
          utm_content?: string | null
          ios_url?: string | null
          android_url?: string | null
          enable_geolocation?: boolean
          enable_device_targeting?: boolean
          created_at?: string
          updated_at: string
        }
        Update: {
          id?: string
          workspace_id?: string
          folder_id?: string | null
          campaign_id?: string | null
          slug?: string
          url?: string
          title?: string | null
          description?: string | null
          image?: string | null
          favicon?: string | null
          password?: string | null
          expires_at?: string | null
          is_active?: boolean
          click_limit?: number | null
          click_count?: number
          last_clicked_at?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_term?: string | null
          utm_content?: string | null
          ios_url?: string | null
          android_url?: string | null
          enable_geolocation?: boolean
          enable_device_targeting?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "links_workspace_id_fkey"
            columns: ["workspace_id"]
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_folder_id_fkey"
            columns: ["folder_id"]
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_campaign_id_fkey"
            columns: ["campaign_id"]
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          }
        ]
      }
      click_events: {
        Row: {
          id: string
          link_id: string
          timestamp: string
          ip_address: string | null
          user_agent: string | null
          referer: string | null
          device: string | null
          os: string | null
          browser: string | null
          country: string | null
          region: string | null
          city: string | null
          latitude: number | null
          longitude: number | null
        }
        Insert: {
          id?: string
          link_id: string
          timestamp?: string
          ip_address?: string | null
          user_agent?: string | null
          referer?: string | null
          device?: string | null
          os?: string | null
          browser?: string | null
          country?: string | null
          region?: string | null
          city?: string | null
          latitude?: number | null
          longitude?: number | null
        }
        Update: {
          id?: string
          link_id?: string
          timestamp?: string
          ip_address?: string | null
          user_agent?: string | null
          referer?: string | null
          device?: string | null
          os?: string | null
          browser?: string | null
          country?: string | null
          region?: string | null
          city?: string | null
          latitude?: number | null
          longitude?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "click_events_link_id_fkey"
            columns: ["link_id"]
            referencedRelation: "links"
            referencedColumns: ["id"]
          }
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}