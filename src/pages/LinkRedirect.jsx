import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function LinkRedirect() {
  const { code } = useParams();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (hasRedirected.current) return;
    hasRedirected.current = true;
    const handleRedirect = async () => {
      try {
        // Increment the click counter and get the destination URL
        const { data, error } = await supabase.rpc('increment_utm_click', {
          p_short_code: code,
        });

        if (error) {
          console.error('Error tracking click:', error);
          // Fallback: try to just get the url if the RPC fails
          const { data: linkData } = await supabase
            .from('utm_links')
            .select('full_utm_url')
            .eq('short_code', code)
            .single();
            
          if (linkData?.full_utm_url) {
            window.location.replace(linkData.full_utm_url);
            return;
          }
        } else if (data) {
          window.location.replace(data);
          return;
        }

        // If not found or error, redirect to home
        window.location.replace('/');
      } catch (err) {
        console.error('Redirect failed:', err);
        window.location.replace('/');
      }
    };

    if (code) {
      handleRedirect();
    }
  }, [code]);

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <p style={{ color: '#64748b' }}>Redirecting...</p>
    </div>
  );
}
