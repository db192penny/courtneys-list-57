import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MagicLinkLoaderProps {
  communityName?: string;
}

export function MagicLinkLoader({ communityName: propsCommunityName }: MagicLinkLoaderProps = {}) {
  const [searchParams] = useSearchParams();
  const [displayName, setDisplayName] = useState<string>("");
  
  useEffect(() => {
    const fetchUserCommunity = async () => {
      try {
        // Try to get authenticated user's actual community from database
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('signup_source')
            .eq('id', user.id)
            .maybeSingle();
          
          if (userData?.signup_source?.startsWith('community:')) {
            const userCommunitySlug = userData.signup_source.replace('community:', '');
            // Format slug to display name
            const formattedCommunity = userCommunitySlug.split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            setDisplayName(formattedCommunity);
            console.log("🎯 MagicLinkLoader: Using user's community from database:", formattedCommunity);
            return;
          }
        }
      } catch (error) {
        console.error("MagicLinkLoader: Error fetching user community:", error);
      }
      
      // Fallback to URL or props
      const contextFromUrl = searchParams.get("context") || searchParams.get("community");
      const urlCommunityName = contextFromUrl ? 
        contextFromUrl.split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ') 
        : "";
      
      // Format props if it's a slug
      const formattedPropsCommunity = propsCommunityName?.includes('-') 
        ? propsCommunityName.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        : propsCommunityName;
      
      const fallbackName = formattedPropsCommunity || urlCommunityName || "Good Looking";
      setDisplayName(fallbackName);
      console.log("🎯 MagicLinkLoader: Using fallback display name:", fallbackName);
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