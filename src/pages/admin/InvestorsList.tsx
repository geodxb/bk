import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import InvestorsList from '../../components/admin/InvestorsList';
import AddInvestorModal from '../../components/admin/AddInvestorModal';
import Button from '../../components/common/Button';
import { UserPlus } from 'lucide-react';

const InvestorsListPage = () => {
  const [addInvestorModalOpen, setAddInvestorModalOpen] = useState(false);

  return (
    <DashboardLayout title="Investors">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Investor Management</h2>
          <p className="text-gray-600">Manage investor profiles, add new investors, and monitor performance</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setAddInvestorModalOpen(true)}
        >
          <UserPlus size={18} className="mr-2" />
          Add Investor
        </Button>
      </div>
      
      <InvestorsList />
      
      <AddInvestorModal
        isOpen={addInvestorModalOpen}
        onClose={() => setAddInvestorModalOpen(false)}
        onSuccess={() => {
          setAddInvestorModalOpen(false);
          // Refresh the investors list
          window.location.reload();
        }}
      />
    </DashboardLayout>
  );
};

export default InvestorsListPage;