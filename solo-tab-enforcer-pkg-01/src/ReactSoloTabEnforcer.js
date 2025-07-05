const React = require('react');
const { useState, useEffect, useCallback } = React;
const SoloTabEnforcer = require('./SoloTabEnforcer');

const DefaultFallback = ({ tabId, message }) => {
  return React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
        padding: '20px',
      },
    },
    [
      React.createElement(
        'h1',
        {
          key: 'title',
          style: { color: '#e74c3c', marginBottom: '20px' },
        },
        'Multiple Tabs Detected'
      ),
      React.createElement(
        'p',
        {
          key: 'message',
          style: { fontSize: '16px', color: '#333', marginBottom: '20px' },
        },
        message
      ),
      React.createElement(
        'p',
        {
          key: 'tabId',
          style: { fontSize: '12px', color: '#666' },
        },
        `Tab ID: ${tabId}`
      ),
      React.createElement(
        'button',
        {
          key: 'button',
          onClick: () => window.location.reload(),
          style: {
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '20px',
          },
        },
        'Reload Page'
      ),
    ]
  );
};

const ReactSoloTabEnforcer = ({
  children,
  fallbackComponent: FallbackComponent = DefaultFallback,
  ...enforcerOptions
}) => {
  const [isActive, setIsActive] = useState(true);
  const [tabId, setTabId] = useState('');
  const [enforcer, setEnforcer] = useState(null);

  const handleDuplicateTab = useCallback((tabId) => {
    setIsActive(false);
    setTabId(tabId);
  }, []);

  const handleTabBecomeActive = useCallback((tabId) => {
    setIsActive(true);
    setTabId(tabId);
  }, []);

  useEffect(() => {
    const enforcerInstance = new SoloTabEnforcer({
      ...enforcerOptions,
      onDuplicateTab: handleDuplicateTab,
      onTabBecomeActive: handleTabBecomeActive,
      autoRedirect: false, // We handle the UI ourselves
    });

    setEnforcer(enforcerInstance);
    enforcerInstance.start();
    setTabId(enforcerInstance.getCurrentTabId());

    return () => {
      enforcerInstance.destroy();
    };
  }, [enforcerOptions, handleDuplicateTab, handleTabBecomeActive]);

  if (!isActive) {
    return React.createElement(FallbackComponent, {
      tabId: tabId,
      message:
        enforcerOptions.warningMessage ||
        'This application is already open in another tab.',
    });
  }

  return children;
};

module.exports = ReactSoloTabEnforcer;
