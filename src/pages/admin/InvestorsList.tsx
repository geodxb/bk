import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import AddInvestorModal from '../../components/admin/AddInvestorModal';
import { useInvestors } from '../../hooks/useFirestore';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  Eye, 
  Edit, 
  Search, 
  Filter,
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle,
  User,
  MapPin,
  Calendar,
  DollarSign
} from 'lucide-react';

const InvestorsListPage = () => {
  const navigate = useNavigate();
  const { investors, loading, error, refetch } = useInvestors();
  const [addInvestorModalOpen, setAddInvestorModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter investors based on search and status
  const filteredInvestors = investors.filter(investor => {
    const matchesSearch = investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && (!investor.accountStatus || investor.accountStatus.includes('Active'))) ||
      (statusFilter === 'restricted' && investor.accountStatus?.includes('Restricted')) ||
      (statusFilter === 'closed' && investor.accountStatus?.includes('Closed'));
    
    return matchesSearch && matchesStatus;
  });

  // Sort investors
  const sortedInvestors = [...filteredInvestors].sort((a, b) => {
    const aValue = a[sortField as keyof typeof a];
    const bValue = b[sortField as keyof typeof b];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Calculate summary statistics
  const totalAUM = investors.reduce((sum, inv) => sum + (inv.currentBalance || 0), 0);
  const activeInvestors = investors.filter(inv => !inv.accountStatus?.includes('Closed')).length;
  const restrictedInvestors = investors.filter(inv => inv.accountStatus?.includes('Restricted')).length;
  const profitableInvestors = investors.filter(inv => inv.currentBalance > inv.initialDeposit).length;

  const columns = [
    {
      key: 'profile',
      header: 'Investor Profile',
      render: (_: any, row: any) => (
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center border-2 border-blue-300">
            <span className="text-blue-700 font-bold text-lg">
              {row.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-lg">{row.name}</p>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <MapPin size={12} />
                <span>{row.country}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar size={12} />
                <span>Joined {new Date(row.joinDate).toLocaleDateString()}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">ID: {row.id.slice(-8)}</p>
          </div>
        </div>
      )
    },
    {
      key: 'portfolio',
      header: 'Portfolio Overview',
      render: (_: any, row: any) => {
        const performance = row.currentBalance - row.initialDeposit;
        const performancePercent = row.initialDeposit > 0 ? (performance / row.initialDeposit) * 100 : 0;
        const isPositive = performance >= 0;
        
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Balance</span>
              <span className="font-bold text-lg text-gray-900">${row.currentBalance.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Initial Deposit</span>
              <span className="text-gray-700">${row.initialDeposit.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Performance</span>
              <div className="flex items-center space-x-1">
                {isPositive ? (
                  <TrendingUp size={14} className="text-green-600" />
                ) : (
                  <TrendingDown size={14} className="text-red-600" />
                )}
                <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}${performance.toLocaleString()} ({performancePercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Account Status',
      render: (value: string, row: any) => {
        const status = value || 'Active';
        let bgColor = 'bg-green-100';
        let textColor = 'text-green-800';
        let borderColor = 'border-green-200';
        let icon = <CheckCircle size={14} />;
        
        if (status.includes('Restricted')) {
          bgColor = 'bg-amber-100';
          textColor = 'text-amber-800';
          borderColor = 'border-amber-200';
          icon = <XCircle size={14} />;
        } else if (status.includes('Closed')) {
          bgColor = 'bg-red-100';
          textColor = 'text-red-800';
          borderColor = 'border-red-200';
          icon = <XCircle size={14} />;
        }
        
        return (
          <div className="space-y-2">
            <div className={`inline-flex items-center px-3 py-2 rounded-lg border ${bgColor} ${textColor} ${borderColor}`}>
              {icon}
              <span className="ml-2 font-medium">{status}</span>
            </div>
            {row.email && (
              <p className="text-xs text-gray-500">{row.email}</p>
            )}
            {row.phone && (
              <p className="text-xs text-gray-500">{row.phone}</p>
            )}
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center' as 'center',
      render: (_: any, row: any) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/investor/${row.id}`)}
            className="flex items-center"
          >
            <Eye size={14} className="mr-1" />
            View
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/admin/investor/${row.id}`)}
            className="flex items-center"
          >
            <Edit size={14} className="mr-1" />
            Manage
          </Button>
        </div>
      )
    }
  ];

  if (error) {
    return (
      <DashboardLayout title="Holdings">
        <Card title="Error Loading Investor Profiles">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={refetch}>
              Retry Loading
            </Button>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Holdings">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Investor Holdings</h2>
            <p className="text-gray-600">Manage investor profiles and monitor portfolio performance</p>
          </div>
          <Button
            variant="primary"
            onClick={() => setAddInvestorModalOpen(true)}
            className="flex items-center"
          >
            <UserPlus size={18} className="mr-2" />
            Add New Investor
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 font-semibold text-sm">Total AUM</p>
              <p className="text-blue-900 text-2xl font-bold">${totalAUM.toLocaleString()}</p>
              <p className="text-blue-600 text-xs mt-1">Assets Under Management</p>
            </div>
            <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
              <DollarSign className="text-blue-700" size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 font-semibold text-sm">Active Investors</p>
              <p className="text-green-900 text-2xl font-bold">{activeInvestors}</p>
              <p className="text-green-600 text-xs mt-1">Currently active accounts</p>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-700" size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 font-semibold text-sm">Profitable</p>
              <p className="text-purple-900 text-2xl font-bold">{profitableInvestors}</p>
              <p className="text-purple-600 text-xs mt-1">Accounts in profit</p>
            </div>
            <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
              <TrendingUp className="text-purple-700" size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-700 font-semibold text-sm">Restricted</p>
              <p className="text-amber-900 text-2xl font-bold">{restrictedInvestors}</p>
              <p className="text-amber-600 text-xs mt-1">Accounts with restrictions</p>
            </div>
            <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center">
              <XCircle className="text-amber-700" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6 bg-white border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm text-gray-700">Status:</span>
            </div>
            <div className="flex space-x-1">
              {[
                { key: 'all', label: 'All', count: investors.length },
                { key: 'active', label: 'Active', count: activeInvestors },
                { key: 'restricted', label: 'Restricted', count: restrictedInvestors },
                { key: 'closed', label: 'Closed', count: investors.filter(inv => inv.accountStatus?.includes('Closed')).length }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setStatusFilter(filter.key)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    statusFilter === filter.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search investors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-64"
            />
          </div>
        </div>
      </Card>

      {/* Investor Profiles Table */}
      <Card title={`Investor Profiles (${sortedInvestors.length})`} className="bg-white border border-gray-200">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading investor profiles from Firebase...</p>
          </div>
        ) : sortedInvestors.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Investor Profiles Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'No investors match your current filters. Try adjusting your search criteria.'
                : 'Get started by adding your first investor profile to the platform.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button
                variant="primary"
                onClick={() => setAddInvestorModalOpen(true)}
                className="flex items-center mx-auto"
              >
                <UserPlus size={18} className="mr-2" />
                Add First Investor
              </Button>
            )}
          </div>
        ) : (
          <>
            <Table 
              columns={columns} 
              data={sortedInvestors}
              isLoading={loading}
              emptyMessage="No investor profiles found"
            />

            {/* Summary Footer */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Showing Results</p>
                  <p className="font-bold text-gray-900 text-lg">{sortedInvestors.length}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Total Portfolio Value</p>
                  <p className="font-bold text-blue-600 text-lg">
                    ${sortedInvestors.reduce((sum, inv) => sum + inv.currentBalance, 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Average Account Size</p>
                  <p className="font-bold text-purple-600 text-lg">
                    ${sortedInvestors.length > 0 ? Math.round(sortedInvestors.reduce((sum, inv) => sum + inv.currentBalance, 0) / sortedInvestors.length).toLocaleString() : '0'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Success Rate</p>
                  <p className="font-bold text-green-600 text-lg">
                    {sortedInvestors.length > 0 ? ((sortedInvestors.filter(inv => inv.currentBalance > inv.initialDeposit).length / sortedInvestors.length) * 100).toFixed(1) : '0.0'}%
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Add Investor Modal */}
      <AddInvestorModal
        isOpen={addInvestorModalOpen}
        onClose={() => setAddInvestorModalOpen(false)}
        onSuccess={() => {
          setAddInvestorModalOpen(false);
          refetch(); // Refresh the investor list
        }}
      />
    </DashboardLayout>
  );
};

export default InvestorsListPage;