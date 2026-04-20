/**
 * Configuration Hook for React Components
 * Provides easy access to dynamic configuration throughout the app
 */
import { useState, useEffect, useContext, createContext } from 'react';
import configService from '../services/configService.js';

// Configuration Context
const ConfigContext = createContext(null);

// Configuration Provider Component
export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [apiInfo, setApiInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { config: loadedConfig, apiInfo: loadedApiInfo } = await configService.loadConfig();
      
      setConfig(loadedConfig);
      setApiInfo(loadedApiInfo);
      
      console.log('✅ Configuration loaded in React context');
    } catch (err) {
      console.error('❌ Failed to load configuration in React context:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const reloadConfiguration = async () => {
    await configService.reload();
    await loadConfiguration();
  };

  const value = {
    config,
    apiInfo,
    isLoading,
    error,
    reloadConfiguration,
    
    // Helper methods
    get: (key, defaultValue) => configService.get(key, defaultValue),
    getEndpoint: (name) => configService.getEndpoint(name),
    isFeatureEnabled: (feature) => configService.isFeatureEnabled(feature),
    getFileUploadConfig: () => configService.getFileUploadConfig(),
    isProduction: () => configService.isProduction(),
    getEnvironment: () => configService.getEnvironment(),
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

// Hook to use configuration
export const useConfig = () => {
  const context = useContext(ConfigContext);
  
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  
  return context;
};

// Hook for API endpoints
export const useApiEndpoints = () => {
  const { getEndpoint } = useConfig();
  
  return {
    // Auth endpoints
    login: () => getEndpoint('login'),
    register: () => getEndpoint('register'),
    refresh: () => getEndpoint('refresh'),
    logout: () => getEndpoint('logout'),
    profile: () => getEndpoint('profile'),
    
    // User endpoints
    mentors: () => getEndpoint('mentors'),
    students: () => getEndpoint('students'),
    applications: () => getEndpoint('applications'),
    
    // Session endpoints
    sessions: () => getEndpoint('sessions'),
    reviews: () => getEndpoint('reviews'),
    messages: () => getEndpoint('messages'),
  };
};

// Hook for feature flags
export const useFeatures = () => {
  const { isFeatureEnabled } = useConfig();
  
  return {
    messaging: isFeatureEnabled('messaging_enabled'),
    fileUpload: isFeatureEnabled('file_upload_enabled'),
    notifications: isFeatureEnabled('notifications_enabled'),
    analytics: isFeatureEnabled('analytics_enabled'),
    caching: isFeatureEnabled('caching_enabled'),
    rateLimit: isFeatureEnabled('rate_limiting_enabled'),
  };
};

// Hook for file upload configuration
export const useFileUpload = () => {
  const { getFileUploadConfig } = useConfig();
  
  const fileConfig = getFileUploadConfig();
  
  const validateFile = (file) => {
    const errors = [];
    
    if (file.size > fileConfig.maxSize) {
      errors.push(`File size exceeds maximum allowed size of ${Math.round(fileConfig.maxSize / 1024 / 1024)}MB`);
    }
    
    if (!fileConfig.supportedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not supported`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return {
    maxSize: fileConfig.maxSize,
    supportedTypes: fileConfig.supportedTypes,
    maxSizeFormatted: formatFileSize(fileConfig.maxSize),
    validateFile,
    formatFileSize,
  };
};

// Hook for environment-specific behavior
export const useEnvironment = () => {
  const { isProduction, getEnvironment } = useConfig();
  
  return {
    isProduction: isProduction(),
    isDevelopment: getEnvironment() === 'development',
    isStaging: getEnvironment() === 'staging',
    environment: getEnvironment(),
  };
};

export default useConfig;