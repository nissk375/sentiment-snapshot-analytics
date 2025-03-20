
import { toast } from "sonner";

export interface NewsletterPreferences {
  email: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  includeSectorAnalysis: boolean;
  includeTopStocks: boolean;
  includeNewsDigest: boolean;
  includePredictions: boolean;
}

export interface NewsletterSubscription {
  id: string;
  createdAt: string;
  preferences: NewsletterPreferences;
  isActive: boolean;
}

class NewsletterService {
  private subscriptions: NewsletterSubscription[] = [];
  
  constructor() {
    // In a real app, we would load subscriptions from localStorage or an API
    this.loadSubscriptions();
  }
  
  private loadSubscriptions() {
    try {
      const saved = localStorage.getItem('newsletter_subscriptions');
      if (saved) {
        this.subscriptions = JSON.parse(saved);
      }
    } catch (error) {
      console.error("Failed to load newsletter subscriptions:", error);
    }
  }
  
  private saveSubscriptions() {
    try {
      localStorage.setItem('newsletter_subscriptions', JSON.stringify(this.subscriptions));
    } catch (error) {
      console.error("Failed to save newsletter subscriptions:", error);
    }
  }
  
  async subscribe(preferences: NewsletterPreferences): Promise<NewsletterSubscription | null> {
    try {
      // In a real app, this would be an API call
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Check if email already exists
      const existingIndex = this.subscriptions.findIndex(
        sub => sub.preferences.email === preferences.email
      );
      
      if (existingIndex >= 0) {
        // Update existing subscription
        const updated: NewsletterSubscription = {
          ...this.subscriptions[existingIndex],
          preferences,
          isActive: true
        };
        
        this.subscriptions[existingIndex] = updated;
        this.saveSubscriptions();
        
        toast.success("Newsletter preferences updated", {
          description: "You'll receive updates based on your new preferences."
        });
        
        return updated;
      }
      
      // Create new subscription
      const newSubscription: NewsletterSubscription = {
        id: `sub_${Date.now()}`,
        createdAt: new Date().toISOString(),
        preferences,
        isActive: true
      };
      
      this.subscriptions.push(newSubscription);
      this.saveSubscriptions();
      
      toast.success("Newsletter subscription confirmed", {
        description: `You'll receive ${preferences.frequency} updates to ${preferences.email}.`
      });
      
      return newSubscription;
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      toast.error("Failed to process subscription", {
        description: "Please try again later."
      });
      return null;
    }
  }
  
  async unsubscribe(email: string): Promise<boolean> {
    try {
      // In a real app, this would be an API call
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Find subscription
      const index = this.subscriptions.findIndex(
        sub => sub.preferences.email === email
      );
      
      if (index < 0) {
        toast.error("Subscription not found", {
          description: "No active subscription found for this email."
        });
        return false;
      }
      
      // Update subscription to inactive
      this.subscriptions[index] = {
        ...this.subscriptions[index],
        isActive: false
      };
      
      this.saveSubscriptions();
      
      toast.success("Unsubscribed successfully", {
        description: "You won't receive any more newsletter emails."
      });
      
      return true;
    } catch (error) {
      console.error("Error unsubscribing from newsletter:", error);
      toast.error("Failed to process unsubscription", {
        description: "Please try again later."
      });
      return false;
    }
  }
  
  async getSubscription(email: string): Promise<NewsletterSubscription | null> {
    // In a real app, this would be an API call
    const subscription = this.subscriptions.find(
      sub => sub.preferences.email === email && sub.isActive
    );
    
    return subscription || null;
  }
}

// Create and export a singleton instance
export const newsletterService = new NewsletterService();
