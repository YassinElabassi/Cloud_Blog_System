"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';

export default function TestConnection() {
  const [message, setMessage] = useState('Testing connection...');

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test CSRF cookie
        await axios.get('http://localhost:8000/sanctum/csrf-cookie', {
          withCredentials: true
        });
        
        // Test API route
        const response = await axios.get('http://localhost:8000/api/test', {
          withCredentials: true
        });
        
        setMessage(`Connection successful: ${JSON.stringify(response.data)}`);
      } catch (error: any) {
        setMessage(`Connection failed: ${error.message}`);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Connection Test</h1>
        <p>{message}</p>
      </div>
    </div>
  );
}