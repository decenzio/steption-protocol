import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sdenuvnwtecejgygmrvn.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Public client for browser use
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface NewsletterSubscriber {
  id: string;
  email: string;
  created_at: string;
}

export interface SubscribeResponse {
  success: boolean;
  error?: string;
}

// Newsletter service
export const newsletterService = {
  /**
   * Subscribe an email to the newsletter
   */
  async subscribe(email: string): Promise<SubscribeResponse> {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      if (!normalizedEmail || !normalizedEmail.includes("@")) {
        return {
          success: false,
          error: "Please enter a valid email address",
        };
      }

      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || "Failed to subscribe. Please try again.",
        };
      }

      return result;
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      return {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      };
    }
  },

  /**
   * Check if an email is already subscribed
   */
  async isSubscribed(email: string): Promise<boolean> {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (error) {
        console.error("Error checking subscription:", error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error("Error checking subscription:", error);
      return false;
    }
  },
};
