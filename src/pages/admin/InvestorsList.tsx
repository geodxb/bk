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
  DollarSign,
  AlertTriangle,
  Users
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

  // Refined industrial-style columns
  const columns = [
    {
      key: 'profile',
      header: 'Investor Profile',
      render: (_: any, row: any) => (
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-100 border border-gray-300 flex items-center justify-center">
            <span className="text-gray-700 font-semibold text-sm">
              {row.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-lg">{row.name}</p>
            <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
              <div className="flex items-center space-x-1">
                <MapPin size={12} />
                <span>{row.country}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar size={12} />
                <span>
                  {new Date(row.joinDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-gray-500">ID:</span>
              <span className="text-xs font-mono bg-gray-100 px-2 py-1 border border-gray-300 text-gray-700">
                {row.id.slice(-8)}
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'portfolio',
      header: 'Portfolio Metrics',
      render: (_: any, row: any) => {
        const performance = row.currentBalance - row.initialDeposit;
        const performancePercent = row.initialDeposit > 0 ? (performance / row.initialDeposit) * 100 : 0;
        const isPositive = performance >= 0;
        
        return (
          <div className="bg-gray-50 p-4 border border-gray-200 rounded">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">Current Balance</p>
                <p className="font-bold text-lg text-gray-900">${row.currentBalance.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Initial Deposit</p>
                <p className="font-semibold text-gray-700">${row.initialDeposit.toLocaleString()}</p>
              </div>
              <div className="col-span-2 border-t border-gray-300 pt-2">
                <p className="text-xs text-gray-600 mb-1">Performance</p>
                <div className="flex items-center space-x-2">
                  {isPositive ? (
                    <TrendingUp size={14} className="text-green-600" />
                  ) : (
                    <TrendingDown size={14} className="text-red-600" />
                  )}
                  <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : ''}${performance.toLocaleString()}
                  </span>
                  <span className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    ({performancePercent.toFixed(1)}%)
                  </span>
                </div>
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
          icon = <AlertTriangle size={14} />;
        } else if (status.includes('Closed')) {
          bgColor = 'bg-red-100';
          textColor = 'text-red-800';
          borderColor = 'border-red-200';
          icon = <XCircle size={14} />;
        }
        
        return (
          <div className="space-y-3">
            <div className={`inline-flex items-center px-3 py-2 border ${bgColor} ${textColor} ${borderColor} rounded`}>
              {icon}
              <span className="ml-2 font-medium text-sm">{status}</span>
            </div>
            {row.email && (
              <div className="bg-gray-50 p-2 border border-gray-200 rounded">
                <p className="text-xs text-gray-600 mb-1">Email</p>
                <p className="text-xs font-mono text-gray-800">{row.email}</p>
              </div>
            )}
            {row.phone && (
              <div className="bg-gray-50 p-2 border border-gray-200 rounded">
                <p className="text-xs text-gray-600 mb-1">Phone</p>
                <p className="text-xs font-mono text-gray-800">{row.phone}</p>
              </div>
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
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/investor/${row.id}`)}
            className="w-full"
          >
            <Eye size={14} className="mr-2" />
            View
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/admin/investor/${row.id}`)}
            className="w-full"
          >
            <Edit size={14} className="mr-2" />
            Manage
          </Button>
        </div>
      )
    }
  ];

  if (error) {
    return (
      <DashboardLayout title="Holdings">
        <Card title="Error Loading Investor Data" className="bg-white border border-red-300">
          <div className="text-center py-8">
            <AlertTriangle size={48} className="mx-auto text-red-600 mb-4" />
            <p className="text-red-600 mb-4 font-medium">{error}</p>
            <Button 
              variant="outline" 
              onClick={refetch}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Retry Loading
            </Button>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Holdings">
      {/* Refined Header */}
      <div className="mb-8">
        <div className="bg-white border border-gray-200 p-6 rounded-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Investor Holdings</h2>
              <p className="text-gray-600 mt-1">Portfolio management and performance monitoring</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setAddInvestorModalOpen(true)}
            >
              <UserPlus size={18} className="mr-2" />
              Add New Investor
            </Button>
          </div>
        </div>
      </div>

      {/* Refined Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white border border-gray-200">
          <div className="p-6">
            <div className="border-b border-gray-200 pb-3 mb-4">
              <p className="text-gray-600 font-medium text-sm">Total AUM</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 text-2xl font-bold">${totalAUM.toLocaleString()}</p>
                <p className="text-gray-500 text-xs mt-1">Assets Under Management</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-blue-600" size={20} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-gray-200">
          <div className="p-6">
            <div className="border-b border-gray-200 pb-3 mb-4">
              <p className="text-gray-600 font-medium text-sm">Active Accounts</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 text-2xl font-bold">{activeInvestors}</p>
                <p className="text-gray-500 text-xs mt-1">Operational Status</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-600" size={20} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-gray-200">
          <div className="p-6">
            <div className="border-b border-gray-200 pb-3 mb-4">
              <p className="text-gray-600 font-medium text-sm">Profitable</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 text-2xl font-bold">{profitableInvestors}</p>
                <p className="text-gray-500 text-xs mt-1">Positive Performance</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-purple-600" size={20} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-gray-200">
          <div className="p-6">
            <div className="border-b border-gray-200 pb-3 mb-4">
              <p className="text-gray-600 font-medium text-sm">Restricted</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 text-2xl font-bold">{restrictedInvestors}</p>
                <p className="text-gray-500 text-xs mt-1">Compliance Review</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-amber-600" size={20} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Refined Filters and Search */}
      <Card className="mb-8 bg-white border border-gray-200">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <Filter size={16} className="text-gray-500" />
                <span className="text-sm text-gray-700 font-medium">Status Filter:</span>
              </div>
              <div className="flex space-x-2">
                {[
                  { key: 'all', label: 'All', count: investors.length },
                  { key: 'active', label: 'Active', count: activeInvestors },
                  { key: 'restricted', label: 'Restricted', count: restrictedInvestors },
                  { key: 'closed', label: 'Closed', count: investors.filter(inv => inv.accountStatus?.includes('Closed')).length }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setStatusFilter(filter.key)}
                    className={`px-3 py-2 text-sm font-medium border transition-colors ${
                      statusFilter === filter.key
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
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
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Refined Investor Profiles Table */}
      <Card title={`Investor Profiles (${sortedInvestors.length} records)`} className="bg-white border border-gray-200">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Loading investor profiles from Firebase...</p>
            <p className="text-gray-500 text-sm mt-2">Retrieving account data & transaction history</p>
          </div>
        ) : sortedInvestors.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center mx-auto mb-6">
              <Users size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">No Investor Profiles Found</h3>
            <p className="text-gray-600 mb-8">
              {searchTerm || statusFilter !== 'all' 
                ? 'No investors match the current filter criteria'
                : 'Get started by adding your first investor profile'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button
                variant="primary"
                onClick={() => setAddInvestorModalOpen(true)}
              >
                <UserPlus size={18} className="mr-2" />
                Add First Investor
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {columns.map((column) => (
                      <th 
                        key={column.key}
                        scope="col"
                        className="px-6 py-4 text-sm font-semibold text-gray-700 text-left"
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedInvestors.map((row, index) => (
                    <tr 
                      key={row.id || index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {columns.map((column) => (
                        <td 
                          key={`${row.id || index}-${column.key}`}
                          className="px-6 py-6 text-sm text-gray-700"
                        >
                          {column.render ? column.render(row[column.key as keyof typeof row], row) : row[column.key as keyof typeof row]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Refined Summary Footer */}
            <div className="mt-6 p-6 bg-gray-50 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-4 border border-gray-200 rounded">
                  <p className="text-gray-600 mb-2 text-xs font-medium">Showing Results</p>
                  <p className="font-bold text-gray-900 text-xl">{sortedInvestors.length}</p>
                  <p className="text-gray-500 text-xs">Total Records</p>
                </div>
                <div className="bg-white p-4 border border-gray-200 rounded">
                  <p className="text-gray-600 mb-2 text-xs font-medium">Portfolio Value</p>
                  <p className="font-bold text-gray-900 text-xl">
                    ${sortedInvestors.reduce((sum, inv) => sum + inv.currentBalance, 0).toLocaleString()}
                  </p>
                  <p className="text-gray-500 text-xs">Combined AUM</p>
                </div>
                <div className="bg-white p-4 border border-gray-200 rounded">
                  <p className="text-gray-600 mb-2 text-xs font-medium">Average Size</p>
                  <p className="font-bold text-gray-900 text-xl">
                    ${sortedInvestors.length > 0 ? Math.round(sortedInvestors.reduce((sum, inv) => sum + inv.currentBalance, 0) / sortedInvestors.length).toLocaleString() : '0'}
                  </p>
                  <p className="text-gray-500 text-xs">Per Account</p>
                </div>
                <div className="bg-white p-4 border border-gray-200 rounded">
                  <p className="text-gray-600 mb-2 text-xs font-medium">Success Rate</p>
                  <p className="font-bold text-gray-900 text-xl">
                    {sortedInvestors.length > 0 ? ((sortedInvestors.filter(inv => inv.currentBalance > inv.initialDeposit).length / sortedInvestors.length) * 100).toFixed(1) : '0.0'}%
                  </p>
                  <p className="text-gray-500 text-xs">Profitable</p>
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
          refetch(); // Refresh the investor list from Firebase
        }}
      />
    </DashboardLayout>
  );
};

export default InvestorsListPage;