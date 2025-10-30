# Alif Mentorship Hub - Frontend

React-based frontend application for the Alif Mentorship Hub platform.

## 🏗️ Architecture

```
frontend/
├── src/
│   ├── components/           # Reusable React components
│   │   ├── AboutUs.jsx        # About section component
│   │   ├── ApplicationForm.jsx # Student application form
│   │   ├── Features.jsx       # Features showcase
│   │   ├── Footer.jsx         # Site footer
│   │   ├── Hero.jsx           # Hero section
│   │   ├── Navbar.jsx         # Navigation bar
│   │   └── TargetUsers.jsx    # Target users section
│   ├── pages/                 # Page components
│   │   ├── About.jsx          # About page
│   │   ├── Contact.jsx        # Contact page
│   │   ├── Home.jsx           # Home page
│   │   ├── Login.jsx          # Login page
│   │   ├── MentorDashboard.jsx # Mentor dashboard
│   │   ├── Signup.jsx         # Signup page
│   │   └── StudentDashboard.jsx # Student dashboard
│   ├── hooks/                 # Custom React hooks
│   ├── services/              # API services
│   │   └── axios.js           # Axios configuration
│   ├── utils/                 # Utility functions
│   ├── context/               # React context providers
│   │   └── FeaturesData.js    # Features data
│   ├── types/                 # TypeScript type definitions
│   ├── App.jsx                # Main App component
│   ├── App.css                # App styles
│   ├── index.css              # Global styles
│   └── main.jsx               # Application entry point
├── public/                    # Static assets
│   ├── aboutimage.png         # About section image
│   ├── heroimage.png          # Hero section image
│   └── vite.svg               # Vite logo
├── assets/                    # Additional assets
├── package.json               # Dependencies and scripts
├── package-lock.json          # Dependency lock file
├── vite.config.js             # Vite configuration
├── eslint.config.js           # ESLint configuration
└── index.html                 # HTML template
```

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Preview production build:**
   ```bash
   npm run preview
   ```

## 🎨 Design System

### Colors
- **Primary Blue**: `#2563EB` - Main brand color
- **Secondary Indigo**: `#1D4ED8` - Accent color
- **Success Green**: `#10B981` - Success states
- **Warning Yellow**: `#F59E0B` - Warning states
- **Error Red**: `#EF4444` - Error states
- **Gray Scale**: `#F8FAFC` to `#1F2937` - Text and backgrounds

### Typography
- **Headings**: Bold, large sizes for impact
- **Body**: Regular weight, readable sizes
- **Captions**: Smaller, lighter weight

### Components
- **Cards**: Rounded corners, subtle shadows
- **Buttons**: Rounded, hover effects, consistent sizing
- **Forms**: Clean inputs, proper validation states
- **Navigation**: Clean, accessible, responsive

## 🧩 Component Library

### Layout Components
- **Navbar**: Responsive navigation with authentication states
- **Footer**: Simple copyright notice
- **Hero**: Main landing section with call-to-action

### Content Components
- **AboutUs**: Mission and vision section
- **Features**: Program showcase with icons
- **TargetUsers**: User type descriptions
- **ApplicationForm**: Comprehensive student application

### Page Components
- **Home**: Landing page with all sections
- **About**: Detailed about information
- **Contact**: Contact information and form
- **Login/Signup**: Authentication pages
- **Dashboards**: Student and mentor interfaces

## 🔧 Configuration

### Vite Configuration
- React plugin enabled
- Development server on port 5173
- Build optimization
- Asset handling

### ESLint Configuration
- React hooks rules
- React refresh plugin
- Modern JavaScript standards
- Tailwind CSS class suggestions

### Tailwind CSS
- Custom color palette
- Responsive design utilities
- Component-based styling
- Animation utilities

## 📱 Responsive Design

### Breakpoints
- **Mobile**: `< 768px`
- **Tablet**: `768px - 1024px`
- **Desktop**: `> 1024px`

### Mobile-First Approach
- Base styles for mobile
- Progressive enhancement for larger screens
- Touch-friendly interactions
- Optimized performance

## 🔐 Authentication Flow

1. **Login Page**: Username/password form
2. **Signup Page**: Registration form with validation
3. **Token Storage**: JWT tokens in localStorage
4. **Protected Routes**: Dashboard access control
5. **Logout**: Token cleanup and redirect

## 📊 State Management

### Local State
- Component-level state with `useState`
- Form state management
- UI state (loading, errors)

### Context (Future)
- User authentication context
- Application data context
- Theme context

## 🌐 API Integration

### Axios Configuration
- Base URL configuration
- Request/response interceptors
- Error handling
- Token attachment

### API Services
- Authentication endpoints
- Application management
- Mentor operations
- File uploads

## 🎭 Animations

### Framer Motion
- Page transitions
- Component animations
- Scroll-triggered animations
- Loading states

### CSS Transitions
- Hover effects
- Focus states
- Button interactions
- Form validation

## 🧪 Testing

### Testing Strategy
- Component unit tests
- Integration tests
- User interaction tests
- Accessibility tests

### Testing Tools
- Jest for unit testing
- React Testing Library
- Cypress for E2E testing

## 🚀 Performance

### Optimization
- Code splitting
- Lazy loading
- Image optimization
- Bundle analysis

### Monitoring
- Performance metrics
- Error tracking
- User analytics
- Core Web Vitals

## 📝 Development Guidelines

1. **Component Structure**: Functional components with hooks
2. **Naming**: PascalCase for components, camelCase for functions
3. **Props**: TypeScript interfaces for prop types
4. **Styling**: Tailwind CSS classes, avoid inline styles
5. **State**: Use appropriate state management patterns
6. **Performance**: Optimize re-renders, use memo when needed
7. **Accessibility**: Proper ARIA labels, keyboard navigation

## 🔧 Build Process

### Development
- Hot module replacement
- Source maps
- Fast refresh
- Error overlay

### Production
- Code minification
- Asset optimization
- Tree shaking
- Bundle splitting

## 📦 Deployment

### Static Hosting
- Build the application
- Upload to static hosting service
- Configure routing for SPA
- Set up CDN for assets

### Environment Variables
- API base URL
- Feature flags
- Analytics keys
- Error reporting

## 🔍 Debugging

### Development Tools
- React Developer Tools
- Redux DevTools (if using Redux)
- Browser DevTools
- Network tab monitoring

### Error Handling
- Error boundaries
- Try-catch blocks
- User-friendly error messages
- Error logging

