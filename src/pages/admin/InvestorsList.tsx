import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import AddInvestorModal from '../../components/admin/AddInvestorModal';
import { useInvestors } from '../../hooks/useFirestore';
import { useNavigate } from 'react-router-dom';

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

  // Clean industrial-style columns without excessive styling
  const columns = [
    {
      key: 'name',
      header: (
        <button 
          onClick={() => handleSort('name')}
          className="text-left font-medium text-gray-700 hover:text-gray-900"
        >
          Investor Profile
        </button>
      ),
      render: (_: any, row: any) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-100 border border-gray-300 flex items-center justify-center">
            <span className="text-gray-700 font-medium text-sm">
              {row.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.name}</p>
            <p className="text-sm text-gray-600">{row.country}</p>
            <p className="text-xs text-gray-500">ID: {row.id.slice(-8)}</p>
          </div>
        </div>
      )
    },
    {
      key: 'currentBalance',
      header: (
        <button 
          onClick={() => handleSort('currentBalance')}
          className="text-right font-medium text-gray-700 hover:text-gray-900 w-full"
        >
          Current Balance
        </button>
      ),
      align: 'right' as 'right',
      render: (value: number) => (
        <div className="text-right">
          <p className="font-bold text-lg text-gray-900">${value?.toLocaleString() || '0'}</p>
          <p className="text-xs text-gray-500">USD</p>
        </div>
      )
    },
    {
      key: 'performance',
      header: 'Performance',
      align: 'right' as 'right',
      render: (_: any, row: any) => {
        const performance = row.currentBalance - row.initialDeposit;
        const performancePercent = row.initialDeposit > 0 ? (performance / row.initialDeposit) * 100 : 0;
        const isPositive = performance >= 0;
        
        return (
          <div className="text-right">
            <p className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}${performance.toLocaleString()}
            </p>
            <p className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{performancePercent.toFixed(1)}%
            </p>
          </div>
        );
      }
    },
    {
      key: 'accountStatus',
      header: 'Status',
      render: (value: string) => {
        const status = value || 'Active';
        let statusClass = 'bg-green-100 text-green-800';
        
        if (status.includes('Restricted')) {
          statusClass = 'bg-amber-100 text-amber-800';
        } else if (status.includes('Closed')) {
          statusClass = 'bg-red-100 text-red-800';
        }
        
        return (
          <span className={`px-2 py-1 text-xs rounded ${statusClass}`}>
            {status.length > 15 ? status.substring(0, 15) + '...' : status}
          </span>
        );
      }
    },
    {
      key: 'joinDate',
      header: (
        <button 
          onClick={() => handleSort('joinDate')}
          className="text-left font-medium text-gray-700 hover:text-gray-900"
        >
          Join Date
        </button>
      ),
      render: (value: string) => (
        <div>
          <p className="text-sm text-gray-900">{new Date(value).toLocaleDateString()}</p>
          <p className="text-xs text-gray-500">
            {Math.floor((new Date().getTime() - new Date(value).getTime()) / (1000 * 60 * 60 * 24))} days ago
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center' as 'center',
      render: (_: any, row: any) => (
        <div className="space-y-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/investor/${row.id}`)}
            className="w-full"
          >
            View
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/admin/investor/${row.id}`)}
            className="w-full"
          >
            Manage
          </Button>
        </div>
      )
    }
  ];

  if (error) {
    return (
      <DashboardLayout title="Holdings">
        <Card title="Error Loading Data" className="bg-white border border-gray-300">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4 font-medium">{error}</p>
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
      {/* Clean Header */}
      <div className="mb-8">
        <div className="bg-white border border-gray-300 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">INVESTOR HOLDINGS</h2>
              <p className="text-gray-600 uppercase tracking-wide text-sm">Portfolio management and performance monitoring</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setAddInvestorModalOpen(true)}
            >
              Add New Investor
            </Button>
          </div>
        </div>
      </div>

      {/* Clean Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white border border-gray-300">
          <div className="p-6">
            <div className="border-b border-gray-300 pb-3 mb-4">
              <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">TOTAL AUM</p>
            </div>
            <div>
              <p className="text-gray-900 text-2xl font-bold">${totalAUM.toLocaleString()}</p>
              <p className="text-gray-500 text-xs mt-1">Assets Under Management</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-gray-300">
          <div className="p-6">
            <div className="border-b border-gray-300 pb-3 mb-4">
              <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">ACTIVE ACCOUNTS</p>
            </div>
            <div>
              <p className="text-gray-900 text-2xl font-bold">{activeInvestors}</p>
              <p className="text-gray-500 text-xs mt-1">Operational Status</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-gray-300">
          <div className="p-6">
            <div className="border-b border-gray-300 pb-3 mb-4">
              <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">PROFITABLE</p>
            </div>
            <div>
              <p className="text-gray-900 text-2xl font-bold">{profitableInvestors}</p>
              <p className="text-gray-500 text-xs mt-1">Positive Performance</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-gray-300">
          <div className="p-6">
            <div className="border-b border-gray-300 pb-3 mb-4">
              <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">RESTRICTED</p>
            </div>
            <div>
              <p className="text-gray-900 text-2xl font-bold">{restrictedInvestors}</p>
              <p className="text-gray-500 text-xs mt-1">Compliance Review</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Clean Filters */}
      <Card className="mb-8 bg-white border border-gray-300">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700 font-medium uppercase tracking-wide">STATUS FILTER:</span>
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
                    className={`px-3 py-2 text-sm font-medium border transition-colors uppercase tracking-wide ${
                      statusFilter === filter.key
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search investors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 text-sm focus:ring-1 focus:ring-gray-500 focus:border-gray-500 w-80 uppercase tracking-wide"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Clean Investor Profiles Table */}
      <Card title={`INVESTOR PROFILES (${sortedInvestors.length} RECORDS)`} className="bg-white border border-gray-300">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium uppercase tracking-wide">LOADING INVESTOR PROFILES FROM FIREBASE...</p>
            <p className="text-gray-500 text-sm mt-2 uppercase tracking-wide">Retrieving account data & transaction history</p>
          </div>
        ) : sortedInvestors.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 uppercase tracking-wide">NO INVESTOR PROFILES FOUND</h3>
            <p className="text-gray-600 mb-8 uppercase tracking-wide text-sm">
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
                Add First Investor
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-50">
                    {columns.map((column) => (
                      <th 
                        key={column.key}
                        scope="col"
                        className={`px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wide ${
                          column.align === 'right' ? 'text-right' : 
                          column.align === 'center' ? 'text-center' : 'text-left'
                        }`}
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
                          className={`px-6 py-6 text-sm text-gray-700 ${
                            column.align === 'right' ? 'text-right' : 
                            column.align === 'center' ? 'text-center' : 'text-left'
                          }`}
                        >
                          {column.render ? column.render(row[column.key as keyof typeof row], row) : row[column.key as keyof typeof row]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Clean Summary Footer */}
            <div className="mt-6 p-6 bg-gray-50 border-t border-gray-300">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-4 border border-gray-300">
                  <p className="text-gray-600 mb-2 text-xs font-medium uppercase tracking-wide">SHOWING RESULTS</p>
                  <p className="font-bold text-gray-900 text-xl">{sortedInvestors.length}</p>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Total Records</p>
                </div>
                <div className="bg-white p-4 border border-gray-300">
                  <p className="text-gray-600 mb-2 text-xs font-medium uppercase tracking-wide">PORTFOLIO VALUE</p>
                  <p className="font-bold text-gray-900 text-xl">
                    ${sortedInvestors.reduce((sum, inv) => sum + inv.currentBalance, 0).toLocaleString()}
                  </p>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Combined AUM</p>
                </div>
                <div className="bg-white p-4 border border-gray-300">
                  <p className="text-gray-600 mb-2 text-xs font-medium uppercase tracking-wide">AVERAGE SIZE</p>
                  <p className="font-bold text-gray-900 text-xl">
                    ${sortedInvestors.length > 0 ? Math.round(sortedInvestors.reduce((sum, inv) => sum + inv.currentBalance, 0) / sortedInvestors.length).toLocaleString() : '0'}
                  </p>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Per Account</p>
                </div>
                <div className="bg-white p-4 border border-gray-300">
                  <p className="text-gray-600 mb-2 text-xs font-medium uppercase tracking-wide">SUCCESS RATE</p>
                  <p className="font-bold text-gray-900 text-xl">
                    {sortedInvestors.length > 0 ? ((sortedInvestors.filter(inv => inv.currentBalance > inv.initialDeposit).length / sortedInvestors.length) * 100).toFixed(1) : '0.0'}%
                  </p>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Profitable</p>
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