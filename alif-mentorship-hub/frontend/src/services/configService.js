/**
 * Dynamic Configuration Service
 * Fetches and manages configuration from backend for flexible integration
 */

class ConfigService {
  constructor() {
    this.config = null;
    this.apiInfo = null;
    this.isLoaded = false;
    this.loadPromise = null;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  /**
   * Load configuration from backend
   */
  async loadConfig() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this._fetchConfig();
    return this.loadPromise;
  }

  async _fetchConfig() {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1/';
    
    try {
      // Fetch configuration from backend
      const [configResponse, apiResponse] = await Promise.all([
        fetch(`${baseUrl}config/frontend/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${baseUrl}config/api-info/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (!configResponse.ok || !apiResponse.ok) {
        throw new Error('Failed to fetch configuration');
      }

      const configData = await configResponse.json();
      const apiData = await apiResponse.json();

      if (configData.success && apiData.success) {
        this.config = configData.config;
        this.apiInfo = apiData.api;
        this.isLoaded = true;
        this.retryCount = 0;
        
        console.log('✅ Configuration loaded successfully');
        return { config: this.config, apiInfo: this.apiInfo };
      } else {
        throw new Error('Invalid configuration response');
      }

    } catch (error) {
      console.error('❌ Failed to load configuration:', error);
      
      // Retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`🔄 Retrying configuration load (${this.retryCount}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
        return this._fetchConfig();
      }

      // Fallback to default configuration
      console.log('⚠️ Using fallback configuration');
      this._setFallbackConfig();
      return { config: this.config, apiInfo: this.apiInfo };
    }
  }

  _setFallbackConfig() {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1/';
    
    this.config = {
      apiBaseUrl: baseUrl,
      endpoints: {
        login: `${baseUrl}auth/login/`,
        register: `${baseUrl}auth/register/`,
        refresh: `${baseUrl}auth/refresh/`,
        logout: `${baseUrl}auth/logout/`,
        profile: `${baseUrl}auth/profile/`,
        mentors: `${baseUrl}mentors/`,
        students: `${baseUrl}students/`,
        applications: `${baseUrl}applications/`,
        sessions: `${baseUrl}sessions/`,
        reviews: `${baseUrl}reviews/`,
        messages: `${baseUrl}messages/`
      },
      timeout: 30000,
      retryAttempts: 3,
      cacheDuration: 300000,
      fileUpload: {
        maxSize: 5242880, // 5MB
        supportedTypes: [
          'image/jpeg', 'image/png', 'image/gif',
          'application/pdf', 'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      },
      features: {
        messaging_enabled: true,
        file_upload_enabled: true,
        notifications_enabled: true,
        analytics_enabled: false,
        caching_enabled: true,
        rate_limiting_enabled: true
      },
      environment: 'development'
    };

    this.apiInfo = {
      version: 'v1',
      basePath: '/api',
      endpoints: {
        authentication: ['login', 'register', 'refresh', 'logout', 'profile'],
        users: ['mentors', 'students', 'applications'],
        sessions: ['sessions', 'reviews', 'messages']
      },
      features: {
        authentication: 'JWT with refresh tokens',
        fileUpload: true,
        messaging: true,
        notifications: true,
        rateLimit: true
      }
    };

    this.isLoaded = true;
  }

  /**
   * Get configuration value
   */
  get(key, defaultValue = null) {
    if (!this.isLoaded) {
      console.warn('Configuration not loaded yet');
      return defaultValue;
    }

    const keys = key.split('.');
    let value = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }

    return value;
  }

  /**
   * Get API endpoint URL
   */
  getEndpoint(name) {
    return this.get(`endpoints.${name}`) || this.get('apiBaseUrl') + name + '/';
  }

  /**
   * Get API base URL
   */
  getApiBaseUrl() {
    return this.get('apiBaseUrl');
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(feature) {
    return this.get(`features.${feature}`, false);
  }

  /**
   * Get file upload configuration
   */
  getFileUploadConfig() {
    return this.get('fileUpload', {
      maxSize: 5242880,
      supportedTypes: ['image/jpeg', 'image/png', 'application/pdf']
    });
  }

  /**
   * Get timeout configuration
   */
  getTimeout() {
    return this.get('timeout', 30000);
  }

  /**
   * Get retry attempts
   */
  getRetryAttempts() {
    return this.get('retryAttempts', 3);
  }

  /**
   * Get environment
   */
  getEnvironment() {
    return this.get('environment', 'development');
  }

  /**
   * Check if in production
   */
  isProduction() {
    return this.getEnvironment() === 'production';
  }

  /**
   * Get API information
   */
  getApiInfo() {
    return this.apiInfo;
  }

  /**
   * Reload configuration
   */
  async reload() {
    this.config = null;
    this.apiInfo = null;
    this.isLoaded = false;
    this.loadPromise = null;
    this.retryCount = 0;
    
    return this.loadConfig();
  }

  /**
   * Export configuration for debugging
   */
  exportConfig() {
    return {
      config: this.config,
      apiInfo: this.apiInfo,
      isLoaded: this.isLoaded,
      environment: this.getEnvironment()
    };
  }
}

// Create singleton instance
const configService = new ConfigService();

export default configService;