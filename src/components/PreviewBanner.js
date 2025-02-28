import React from 'react';

const PreviewBanner = () => {
  const bannerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    backgroundColor: '#ff9800',
    color: 'white',
    textAlign: 'center',
    padding: '5px 0',
    zIndex: 1000,
    fontWeight: 'bold',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  };

  return (
    <div style={bannerStyle}>
      PREVIEW MODE - This is a test version of the app
    </div>
  );
};

export default PreviewBanner;