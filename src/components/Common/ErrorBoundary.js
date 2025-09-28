

import React, { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    
    console.error("Uncaught error in a component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <AlertTriangle size={48} style={{ marginBottom: '16px', color: 'red' }} />
          <h2>Что-то пошло не так.</h2>
          <p>В этой части приложения произошла ошибка.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;