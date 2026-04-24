# Error Boundary Documentation

## Overview

VoteVault now has comprehensive error boundaries to catch and handle React errors gracefully, preventing the entire app from crashing and providing user-friendly error messages with recovery options.

---

## Features Implemented

### 1. Main Error Boundary Component
- ✅ Catches JavaScript errors in child components
- ✅ Three levels: app, route, and component
- ✅ Custom fallback UI for each level
- ✅ Error logging to console (dev) and services (production)
- ✅ Recovery options (retry, reload, go home)
- ✅ Error count tracking
- ✅ Stack trace display (dev only)

### 2. Error Boundary Variants
- ✅ AsyncErrorBoundary - Catches promise rejections
- ✅ QueryErrorBoundary - Specialized for React Query
- ✅ RouteErrorBoundary - Wraps route components

### 3. Utilities
- ✅ useErrorHandler hook - Programmatic error throwing
- ✅ withErrorBoundary HOC - Wrap components easily

---

## Usage

### App-Level Error Boundary

```tsx
// src/App.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

const App = () => (
  <ErrorBoundary level="app" onError={(error, errorInfo) => {
    // Log to error reporting service (Sentry, LogRocket, etc.)
    console.error('App-level error:', error, errorInfo);
  }}>
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
    </QueryClientProvider>
  </ErrorBoundary>
);
```

**Features:**
- Full-page error UI
- Multiple recovery options
- Error details display
- Stack trace (dev only)

---

### Route-Level Error Boundary

```tsx
// Wrap all routes
<ErrorBoundary level="route">
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/dashboard" element={<Dashboard />} />
    {/* ... */}
  </Routes>
</ErrorBoundary>
```

**Features:**
- Page section error UI
- Try again and go home buttons
- Doesn't crash entire app

---

### Component-Level Error Boundary

```tsx
// Wrap individual components
import { ErrorBoundary } from '@/components/ErrorBoundary';

const MyPage = () => (
  <div>
    <h1>My Page</h1>
    
    <ErrorBoundary level="component">
      <RiskyComponent />
    </ErrorBoundary>
    
    <SafeComponent />
  </div>
);
```

**Features:**
- Inline error UI
- Retry button
- Rest of page still works

---

### Using the HOC

```tsx
import { withErrorBoundary } from '@/components/ErrorBoundary';

const MyComponent = () => {
  // Component that might throw errors
  return <div>Content</div>;
};

// Wrap with error boundary
export default withErrorBoundary(MyComponent, {
  level: 'component',
  onError: (error) => console.error(error)
});
```

---

### Using the Hook

```tsx
import { useErrorHandler } from '@/components/ErrorBoundary';

const MyComponent = () => {
  const handleError = useErrorHandler();

  const handleClick = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      // This will be caught by the nearest error boundary
      handleError(error as Error);
    }
  };

  return <button onClick={handleClick}>Click me</button>;
};
```

---

### Async Error Boundary

```tsx
import { AsyncErrorBoundary } from '@/components/ErrorBoundaryVariants';

const MyPage = () => (
  <AsyncErrorBoundary>
    <ComponentWithAsyncOperations />
  </AsyncErrorBoundary>
);
```

**Catches:**
- Unhandled promise rejections
- Async/await errors
- setTimeout/setInterval errors

---

### Query Error Boundary

```tsx
import { QueryErrorBoundary } from '@/components/ErrorBoundaryVariants';

const MyPage = () => (
  <QueryErrorBoundary>
    <ComponentWithReactQuery />
  </QueryErrorBoundary>
);
```

**Specialized for:**
- React Query errors
- API call failures
- Data fetching errors

---

## Error Boundary Levels

### Level: "app"

**When to use:** Root level of your application

**UI:** Full-page error screen with:
- Large error icon
- Error message
- Error details (collapsible)
- Stack trace (dev only)
- Three buttons: Try Again, Go Home, Reload Page

**Example:**
```tsx
<ErrorBoundary level="app">
  <App />
</ErrorBoundary>
```

---

### Level: "route"

**When to use:** Around route components or page sections

**UI:** Card-based error display with:
- Error icon and title
- Error message
- Error details (dev only)
- Two buttons: Try Again, Go Home

**Example:**
```tsx
<ErrorBoundary level="route">
  <Routes>
    {/* routes */}
  </Routes>
</ErrorBoundary>
```

---

### Level: "component"

**When to use:** Around individual components that might fail

**UI:** Inline error display with:
- Small error icon
- Brief error message
- Retry button

**Example:**
```tsx
<ErrorBoundary level="component">
  <ComplexWidget />
</ErrorBoundary>
```

---

## Custom Fallback UI

```tsx
const CustomFallback = () => (
  <div className="custom-error">
    <h2>Oops! Something went wrong</h2>
    <p>Please contact support if this persists.</p>
  </div>
);

<ErrorBoundary fallback={<CustomFallback />}>
  <MyComponent />
</ErrorBoundary>
```

---

## Error Logging

### Development
Errors are logged to console with full details:
```
Error Boundary caught an error: TypeError: Cannot read property 'x' of undefined
Error Info: { componentStack: "..." }
```

### Production
Errors are logged to your error reporting service:

```tsx
<ErrorBoundary
  level="app"
  onError={(error, errorInfo) => {
    // Send to Sentry
    Sentry.captureException(error, {
      extra: errorInfo
    });

    // Or LogRocket
    LogRocket.captureException(error);

    // Or custom service
    fetch('/api/log-error', {
      method: 'POST',
      body: JSON.stringify({
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    });
  }}
>
  <App />
</ErrorBoundary>
```

---

## Integration with Error Reporting Services

### Sentry

```bash
npm install @sentry/react
```

```tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// Use Sentry's error boundary
const App = () => (
  <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
    <YourApp />
  </Sentry.ErrorBoundary>
);
```

### LogRocket

```bash
npm install logrocket
```

```tsx
import LogRocket from 'logrocket';

LogRocket.init('YOUR_APP_ID');

<ErrorBoundary
  onError={(error) => {
    LogRocket.captureException(error);
  }}
>
  <App />
</ErrorBoundary>
```

---

## Best Practices

### 1. Use Multiple Levels

```tsx
// App level - catches everything
<ErrorBoundary level="app">
  <App>
    {/* Route level - catches page errors */}
    <ErrorBoundary level="route">
      <Routes />
    </ErrorBoundary>
    
    {/* Component level - catches widget errors */}
    <ErrorBoundary level="component">
      <ComplexWidget />
    </ErrorBoundary>
  </App>
</ErrorBoundary>
```

### 2. Wrap Risky Components

```tsx
// Components that:
// - Fetch data
// - Parse JSON
// - Manipulate DOM
// - Use third-party libraries

<ErrorBoundary level="component">
  <ThirdPartyWidget />
</ErrorBoundary>
```

### 3. Provide Context in Error Messages

```tsx
<ErrorBoundary
  level="component"
  onError={(error) => {
    console.error('Server list failed:', error);
    // Log with context
    logError({
      component: 'ServerList',
      action: 'fetch',
      error: error.message
    });
  }}
>
  <ServerList />
</ErrorBoundary>
```

### 4. Don't Overuse

```tsx
// ❌ Bad - too many boundaries
<ErrorBoundary>
  <ErrorBoundary>
    <ErrorBoundary>
      <SimpleComponent />
    </ErrorBoundary>
  </ErrorBoundary>
</ErrorBoundary>

// ✅ Good - strategic placement
<ErrorBoundary level="route">
  <Page>
    <SimpleComponent />
    <ErrorBoundary level="component">
      <ComplexWidget />
    </ErrorBoundary>
  </Page>
</ErrorBoundary>
```

### 5. Test Error Boundaries

```tsx
// Create a component that throws for testing
const ErrorThrower = () => {
  throw new Error('Test error');
};

// Test in development
<ErrorBoundary level="component">
  {import.meta.env.DEV && <ErrorThrower />}
</ErrorBoundary>
```

---

## Error Recovery Strategies

### 1. Retry

```tsx
const [key, setKey] = useState(0);

<ErrorBoundary
  key={key} // Remount on key change
  level="component"
>
  <DataFetcher />
</ErrorBoundary>

<button onClick={() => setKey(k => k + 1)}>
  Retry
</button>
```

### 2. Fallback to Cached Data

```tsx
<ErrorBoundary
  fallback={<CachedDataView />}
  level="component"
>
  <LiveDataView />
</ErrorBoundary>
```

### 3. Graceful Degradation

```tsx
<ErrorBoundary
  fallback={<BasicFeature />}
  level="component"
>
  <AdvancedFeature />
</ErrorBoundary>
```

---

## Common Error Scenarios

### 1. API Errors

```tsx
import { QueryErrorBoundary } from '@/components/ErrorBoundaryVariants';

<QueryErrorBoundary>
  <ServerList />
</QueryErrorBoundary>
```

### 2. Rendering Errors

```tsx
<ErrorBoundary level="component">
  <ComplexChart data={data} />
</ErrorBoundary>
```

### 3. Third-Party Library Errors

```tsx
<ErrorBoundary level="component">
  <GoogleMaps />
</ErrorBoundary>
```

### 4. Async Operation Errors

```tsx
import { AsyncErrorBoundary } from '@/components/ErrorBoundaryVariants';

<AsyncErrorBoundary>
  <FileUploader />
</AsyncErrorBoundary>
```

---

## Testing

### Manual Testing

```tsx
// Add a button to throw errors in development
{import.meta.env.DEV && (
  <button onClick={() => {
    throw new Error('Test error');
  }}>
    Throw Error
  </button>
)}
```

### Unit Testing

```tsx
import { render } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

test('catches errors', () => {
  const { getByText } = render(
    <ErrorBoundary level="component">
      <ThrowError />
    </ErrorBoundary>
  );

  expect(getByText(/component error/i)).toBeInTheDocument();
});
```

---

## Troubleshooting

### Error Boundary Not Catching Errors

**Problem:** Error boundary doesn't catch the error

**Solutions:**
1. Error boundaries only catch errors in:
   - Rendering
   - Lifecycle methods
   - Constructors

2. They DON'T catch:
   - Event handlers (use try/catch)
   - Async code (use AsyncErrorBoundary)
   - Server-side rendering
   - Errors in error boundary itself

```tsx
// ❌ Won't be caught
<button onClick={() => {
  throw new Error('Click error');
}}>
  Click
</button>

// ✅ Will be caught
const handleClick = () => {
  try {
    riskyOperation();
  } catch (error) {
    handleError(error); // Use useErrorHandler hook
  }
};
```

### Error Boundary Keeps Resetting

**Problem:** Error boundary resets unexpectedly

**Solution:** Use a key to control remounting

```tsx
const [errorKey, setErrorKey] = useState(0);

<ErrorBoundary key={errorKey}>
  <Component />
</ErrorBoundary>
```

---

## Summary

✅ **Implemented:**
- Main ErrorBoundary component with 3 levels
- AsyncErrorBoundary for promise rejections
- QueryErrorBoundary for React Query
- RouteErrorBoundary for routes
- useErrorHandler hook
- withErrorBoundary HOC
- Integrated into App.tsx

✅ **Benefits:**
- Prevents app crashes
- User-friendly error messages
- Multiple recovery options
- Error logging support
- Development-friendly stack traces
- Production-ready

✅ **Next Steps:**
- Integrate with Sentry/LogRocket (optional)
- Add error tracking analytics
- Create custom error pages
- Add error reporting dashboard

---

*Error Boundary Documentation - VoteVault*  
*Last Updated: 2026-04-24*
