import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const useScrollToSection = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's a hash in the URL
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        // Smooth scroll to the element
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // If element doesn't exist on current page, navigate to home page first
        if (location.pathname !== '/') {
          navigate(`/${location.hash}`, { replace: true });
        }
      }
    }
  }, [location, navigate]);

  const scrollToSection = (sectionId: string) => {
    if (location.pathname === '/') {
      // If on home page, just scroll
      const element = document.querySelector(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // If on different page, navigate to home page with hash
      navigate(`/${sectionId}`);
    }
  };

  return { scrollToSection };
};
