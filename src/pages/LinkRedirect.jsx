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
        const sessionKey = `utm_clicked_${code}`;
        const alreadyClicked = sessionStorage.getItem(sessionKey);
        const isBot = /bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent);
        
        let targetUrl = null;
        
        if (!alreadyClicked && !isBot) {
          // Increment the click counter and get the destination URL
          const { data, error } = await supabase.rpc('increment_utm_click', {
            p_short_code: code,
          });
          
          if (!error && data) {
            sessionStorage.setItem(sessionKey, 'true');
            targetUrl = data;
          }
        }
        
        // If it was a bot, already clicked, or RPC failed, fetch URL without incrementing
        if (!targetUrl) {
           const { data: linkData } = await supabase
             .from('utm_links')
             .select('full_utm_url')
             .eq('short_code', code)
             .single();
             
           if (linkData?.full_utm_url) {
             targetUrl = linkData.full_utm_url;
           }
        }

        if (targetUrl) {
          window.location.replace(targetUrl);
        } else {
          window.location.replace('/');
        }
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
