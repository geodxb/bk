import { useState } from 'react';
import { motion } from 'framer-motion';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { FirestoreService } from '../../services/firestoreService';
import { Investor } from '../../types/user';
import { Edit3, Save, X, MapPin, Calendar, DollarSign, TrendingUp } from 'lucide-react';

interface EditableInvestorProfileProps {
  investor: Investor;
  onUpdate: () => void;
}

const EditableInvestorProfile = ({ investor, onUpdate }: EditableInvestorProfileProps) => {
  // Disable editing functionality
  const [isEditing] = useState(false);
  const [isLoading] = useState(false);
  const [error] = useState('');

  const statusOptions = [
    'Active',
    'Restricted for withdrawals (policy violation)',
    'Closed - refund in progress',
    'Closed, deposit refunded'
  ];

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{investor.name}</h2>
            <p className="text-gray-600">Investor ID: {investor.id}</p>
          </div>
          {/* Edit button is now disabled */}
          <Button
            variant="outline"
            disabled
            className="opacity-50 cursor-not-allowed"
          >
            <Edit3 size={18} className="mr-2" />
            Edit Disabled
          </Button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <p className="text-gray-800">{investor.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin size={16} className="inline mr-1" />
                  Country
                </label>
                <p className="text-gray-800">{investor.country}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={16} className="inline mr-1" />
                  Join Date
                </label>
                <p className="text-gray-800">{investor.joinDate}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Status
                </label>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  investor.accountStatus?.includes('Active') || !investor.accountStatus
                    ? 'bg-green-100 text-green-800'
                    : investor.accountStatus?.includes('Restricted')
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {investor.accountStatus || 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <DollarSign size={16} className="inline mr-1" />
                  Initial Deposit
                </label>
                <p className="text-gray-800">${investor.initialDeposit.toLocaleString()}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <TrendingUp size={16} className="inline mr-1" />
                  Current Balance
                </label>
                <p className="text-gray-800 font-semibold">${investor.currentBalance.toLocaleString()}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Gain/Loss
                </label>
                <p className={`font-semibold ${
                  investor.currentBalance >= investor.initialDeposit ? 'text-green-600' : 'text-red-600'
                }`}>
                  {investor.currentBalance >= investor.initialDeposit ? '+' : ''}
                  ${(investor.currentBalance - investor.initialDeposit).toLocaleString()}
                  {' '}
                  ({(((investor.currentBalance - investor.initialDeposit) / investor.initialDeposit) * 100).toFixed(2)}%)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trading Information */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Trading Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Positions Per Day
              </label>
              <p className="text-gray-800">{investor.tradingData?.positionsPerDay || 0}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trading Pairs
              </label>
              <p className="text-gray-800">{investor.tradingData?.pairs?.join(', ') || 'N/A'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Platform
              </label>
              <p className="text-gray-800">{investor.tradingData?.platform || 'N/A'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leverage
              </label>
              <p className="text-gray-800">{investor.tradingData?.leverage || 0}:1</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <p className="text-gray-800">{investor.tradingData?.currency || 'USD'}</p>
            </div>
          </div>
        </div>

        {/* Note about editing being disabled */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Note:</strong> Investor profile editing has been disabled for data integrity. 
            Contact system administrator for any required changes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EditableInvestorProfile;