import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AlertMessages from '../../components/admin/AlertMessages';

const MessagesPage = () => {
  return (
    <DashboardLayout title="Messages">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">AFFILIATE MANAGER MESSAGES</h2>
        <p className="text-gray-600 uppercase tracking-wide text-sm">Important communications about your account</p>
      </div>
      
      <AlertMessages />
    </DashboardLayout>
  );
};

export default MessagesPage;