// React components using TailwindCSS

import React, { useState } from 'react';

// Button component with variants
const Button = ({ variant = 'primary', size = 'md', children, className = '', ...props }) => {
  const baseClasses = 'font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white focus:ring-blue-500',
    ghost: 'text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Card component
const Card = ({ children, className = '', hover = false }) => {
  const hoverClasses = hover ? 'hover:shadow-lg hover:scale-105 transition-all duration-200' : '';
  
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardBody = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '' }) => (
  <div className={`px-6 py-4 bg-gray-50 border-t border-gray-200 ${className}`}>
    {children}
  </div>
);

// Input component with validation states
const Input = ({ 
  label, 
  error, 
  success, 
  helperText, 
  className = '', 
  ...props 
}) => {
  const getInputClasses = () => {
    let classes = 'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm';
    
    if (error) {
      classes += ' border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500';
    } else if (success) {
      classes += ' border-green-300 text-green-900 placeholder-green-300 focus:ring-green-500 focus:border-green-500';
    } else {
      classes += ' border-gray-300 focus:ring-blue-500 focus:border-blue-500';
    }
    
    return classes;
  };
  
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input className={getInputClasses()} {...props} />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {success && (
        <p className="mt-1 text-sm text-green-600">{success}</p>
      )}
      {helperText && !error && !success && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

// Modal component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                {title && (
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {title}
                  </h3>
                )}
                {children}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button variant="primary" onClick={onClose} className="sm:ml-3">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Alert component
const Alert = ({ type = 'info', title, children, onClose }) => {
  const types = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-400',
      title: 'text-blue-800',
      text: 'text-blue-700',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-400',
      title: 'text-green-800',
      text: 'text-green-700',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-400',
      title: 'text-yellow-800',
      text: 'text-yellow-700',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-400',
      title: 'text-red-800',
      text: 'text-red-700',
    },
  };
  
  const config = types[type];
  
  return (
    <div className={`rounded-md ${config.bg} border ${config.border} p-4`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className={`h-5 w-5 ${config.icon}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${config.title}`}>
              {title}
            </h3>
          )}
          <div className={`text-sm ${config.text} ${title ? 'mt-2' : ''}`}>
            {children}
          </div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              onClick={onClose}
              className={`inline-flex rounded-md ${config.bg} ${config.text} hover:${config.text} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${type}-50 focus:ring-${type}-600`}
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Tabs component
const Tabs = ({ defaultTab = 0, children }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  const tabs = React.Children.toArray(children);
  
  return (
    <div>
      <div className="sm:hidden">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(Number(e.target.value))}
          className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        >
          {tabs.map((tab, index) => (
            <option key={index} value={index}>
              {tab.props.label}
            </option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <nav className="flex space-x-8">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === index
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.props.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-4">
        {tabs[activeTab]}
      </div>
    </div>
  );
};

const TabPanel = ({ label, children }) => (
  <div>{children}</div>
);

// Loading spinner component
const LoadingSpinner = ({ size = 'md', color = 'blue' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };
  
  return (
    <div className={`animate-spin rounded-full ${sizes[size]} border-b-2 border-${color}-600`} />
  );
};

// Example usage component
const ExampleApp = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(true);
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">TailwindCSS Components</h1>
        
        {/* Alerts */}
        {showAlert && (
          <div className="mb-8">
            <Alert type="success" title="Success!" onClose={() => setShowAlert(false)}>
              Your changes have been saved successfully.
            </Alert>
          </div>
        )}
        
        {/* Buttons */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Buttons</h2>
          <div className="space-x-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </div>
        
        {/* Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card hover>
              <CardHeader>
                <h3 className="text-lg font-medium">Card Title</h3>
              </CardHeader>
              <CardBody>
                <p className="text-gray-600">This is a card with hover effects.</p>
              </CardBody>
              <CardFooter>
                <Button size="sm">Learn More</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardBody>
                <h3 className="text-lg font-medium mb-2">Simple Card</h3>
                <p className="text-gray-600">This is a simple card without header or footer.</p>
              </CardBody>
            </Card>
          </div>
        </div>
        
        {/* Form */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Form</h2>
          <Card>
            <CardBody>
              <form className="space-y-4">
                <Input 
                  label="Email"
                  type="email"
                  placeholder="Enter your email"
                  helperText="We'll never share your email."
                />
                <Input 
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  error="Password must be at least 8 characters."
                />
                <Button type="submit">Submit</Button>
              </form>
            </CardBody>
          </Card>
        </div>
        
        {/* Tabs */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Tabs</h2>
          <Card>
            <CardBody>
              <Tabs>
                <TabPanel label="Tab 1">
                  <p>Content for tab 1</p>
                </TabPanel>
                <TabPanel label="Tab 2">
                  <p>Content for tab 2</p>
                </TabPanel>
                <TabPanel label="Tab 3">
                  <p>Content for tab 3</p>
                </TabPanel>
              </Tabs>
            </CardBody>
          </Card>
        </div>
        
        {/* Modal trigger */}
        <div className="mb-8">
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
        </div>
        
        <Modal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)}
          title="Example Modal"
        >
          <p>This is an example modal with TailwindCSS styling.</p>
        </Modal>
      </div>
    </div>
  );
};

export { 
  Button, 
  Card, 
  CardHeader, 
  CardBody, 
  CardFooter, 
  Input, 
  Modal, 
  Alert, 
  Tabs, 
  TabPanel, 
  LoadingSpinner,
  ExampleApp 
};