import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MagicLinkLoaderProps {
  communityName?: string;
}

export function MagicLinkLoader({ communityName: propsCommunityName }: MagicLinkLoaderProps = {}) {
  const [searchParams] = useSearchParams();
  
  // Initialize displayName with prop if available
  const [displayName, setDisplayName] = useState<string>(propsCommunityName || "");
  
  useEffect(() => {
    // If community name provided via props, use it and don't fetch
    if (propsCommunityName) {
      console.log('[MagicLinkLoader] Using community from props:', propsCommunityName);
      setDisplayName(propsCommunityName);
      return; // Skip database fetch
    }
    
    // Only fetch if no props provided
    const fetchUserCommunity = async () => {
      console.log('[MagicLinkLoader] No props, fetching from database');
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: userSignupSource } = await (supabase as any)
            .rpc('get_user_signup_source', { _email: user.email });
          
          if (userSignupSource?.startsWith('community:')) {
            const communitySlug = userSignupSource.replace('community:', '');
            const communityDisplay = communitySlug
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            setDisplayName(communityDisplay);
            console.log('[MagicLinkLoader] Fetched community:', communityDisplay);
            return;
          }
        }
      } catch (error) {
        console.error('[MagicLinkLoader] Error fetching community:', error);
      }
      
      // Fallback to URL params
      const contextFromUrl = searchParams.get("context") || searchParams.get("community");
      const urlCommunityName = contextFromUrl ? 
        contextFromUrl.split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ') 
        : "Good Looking";
      
      setDisplayName(urlCommunityName);
      console.log('[MagicLinkLoader] Using URL fallback:', urlCommunityName);
    };
    
    fetchUserCommunity();
  }, [propsCommunityName, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-background">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-3xl font-bold text-primary mb-8">
          Hi {displayName}!
        </h1>
        
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        
        <p className="text-lg text-foreground font-medium animate-pulse max-w-md">
          Finding you a reliable landscaper that doesn't ghost you
        </p>
        
        <p className="text-sm text-muted-foreground mt-4">
          Authenticating your access...
        </p>
      </div>
    </div>
  );
}