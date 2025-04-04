
import {
  useEffect,
  useState,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, getCurrentSession } from "@/integrations/supabase/client";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Set up auth state listener first
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Check if user is admin when session changes
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
      }
      
      setIsLoading(false);
    });

    // Then check for existing session
    const initSession = async () => {
      const { data } = await getCurrentSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      
      // Check admin status
      if (data.session?.user) {
        checkAdminStatus(data.session.user.id);
      }
      
      setIsLoading(false);
    };
    
    initSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Function to check if the user is an admin
  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('is_admin', { uid: userId });
        
      if (error) throw error;
      setIsAdmin(data || false);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  const value = {
    user,
    session,
    isLoading,
    setUser,
    setSession,
    signOut,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
