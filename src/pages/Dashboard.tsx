import { useState, useEffect } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Filter, DollarSign, Building2, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MortgagePackageForm } from "@/components/MortgagePackageForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface MortgagePackage {
  id: string;
  bank: string;
  property_type: string;
  category: string;
  min_loan_size: number;
  package_name: string;
  lockin_period: string;
  rates: string;
  features?: string;
  subsidies?: string;
  remarks?: string;
  last_updated: string;
}

const Dashboard = () => {
  const [packages, setPackages] = useState<MortgagePackage[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<MortgagePackage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [bankFilter, setBankFilter] = useState("all");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all");
  const [lockinFilter, setLockinFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [minLoanFilter, setMinLoanFilter] = useState("");
  const [sortBy, setSortBy] = useState("last_updated");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<MortgagePackage | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    filterAndSortPackages();
    setCurrentPage(1);
  }, [packages, searchTerm, bankFilter, propertyTypeFilter, lockinFilter, categoryFilter, minLoanFilter, sortBy, sortOrder]);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("mortgage_packages")
        .select("*");

      if (error) throw error;
      setPackages((data || []).map(pkg => ({
        ...pkg,
        category: (pkg as any).category || "Fixed"
      })));
    } catch (error) {
      console.error("Error fetching packages:", error);
      toast({
        title: "Error",
        description: "Failed to fetch mortgage packages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortPackages = () => {
    let filtered = packages.filter(pkg => {
      const matchesSearch = pkg.package_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.bank.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBank = bankFilter === "all" || pkg.bank === bankFilter;
      const matchesPropertyType = propertyTypeFilter === "all" || pkg.property_type === propertyTypeFilter;
      const matchesLockin = lockinFilter === "all" || pkg.lockin_period === lockinFilter;
      const matchesCategory = categoryFilter === "all" || pkg.category === categoryFilter;
      let matchesMinLoan = true;
      if (minLoanFilter && !isNaN(Number(minLoanFilter))) {
        matchesMinLoan = Number(minLoanFilter) >= pkg.min_loan_size;
      }
      return matchesSearch && matchesBank && matchesPropertyType && matchesLockin && matchesCategory && matchesMinLoan;
    });

    if (minLoanFilter && !isNaN(Number(minLoanFilter))) {
      const clientLoan = Number(minLoanFilter);
      filtered.sort((a, b) => {
        return b.min_loan_size - a.min_loan_size;
      });
    } else {
      filtered.sort((a, b) => {
        let aVal, bVal;
        switch (sortBy) {
          case "min_loan_size":
            aVal = a.min_loan_size;
            bVal = b.min_loan_size;
            break;
          case "bank":
            aVal = a.bank;
            bVal = b.bank;
            break;
          case "last_updated":
            aVal = new Date(a.last_updated);
            bVal = new Date(b.last_updated);
            break;
          default:
            aVal = a.package_name;
            bVal = b.package_name;
        }
        if (sortOrder === "asc") {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    setFilteredPackages(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package?")) return;

    try {
      const { error } = await supabase
        .from("mortgage_packages")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Mortgage package deleted successfully",
      });

      fetchPackages();
    } catch (error) {
      console.error("Error deleting package:", error);
      toast({
        title: "Error",
        description: "Failed to delete mortgage package",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (pkg: MortgagePackage) => {
    setEditingPackage(pkg);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    fetchPackages();
    setIsFormOpen(false);
    setEditingPackage(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatRates = (rates: string) => {
    return rates.split('<br>').map((rate, index) => (
      <div key={index} className="text-sm text-[#052d4a]">{rate.trim()}</div>
    ));
  };

  const formatFeatures = (features?: string) => {
    if (!features) return null;
    return features.split('<br>').map((feature, index) => (
      <div key={index} className="text-sm text-gray-600">
        • {feature.trim()}
      </div>
    ));
  };

  const uniqueBanks = [...new Set(packages.map(p => p.bank))];
  const uniquePropertyTypes = [...new Set(packages.map(p => p.property_type))];
  const uniqueLockinPeriods = [...new Set(packages.map(p => p.lockin_period))];
  const uniqueCategories = [...new Set(packages.map(p => p.category))];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#03a9e7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-[#052d4a] font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(filteredPackages.length / pageSize);
  const paginatedPackages = filteredPackages.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#052d4a] text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="https://theloanconnection.com.sg/wp-content/uploads/2025/02/TLC-Square-1.png"
                alt="TLC Logo"
                className="w-12 h-12 rounded-lg bg-white p-1"
                style={{objectFit:'contain'}}
              />
              <div>
                <h1 className="text-2xl font-semibold">Mortgage Dashboard</h1>
                <p className="text-sm text-gray-300 mt-1">Compare mortgage packages from Singapore's banks</p>
              </div>
            </div>
            
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-[#03a9e7] hover:bg-[#0285b8] text-white"
                  onClick={() => setEditingPackage(null)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Package
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl text-[#052d4a]">
                    {editingPackage ? "Edit Mortgage Package" : "Add New Mortgage Package"}
                  </DialogTitle>
                </DialogHeader>
                <MortgagePackageForm
                  package={editingPackage}
                  onSuccess={handleFormSuccess}
                  onCancel={() => {
                    setIsFormOpen(false);
                    setEditingPackage(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#03a9e7] bg-opacity-10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#03a9e7]" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Client Loan Amount</div>
                <div className="text-lg font-semibold text-[#052d4a]">{minLoanFilter ? formatCurrency(Number(minLoanFilter)) : "Not Set"}</div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#03a9e7] bg-opacity-10 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#03a9e7]" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Packages</div>
                <div className="text-lg font-semibold text-[#052d4a]">{packages.length}</div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#03a9e7] bg-opacity-10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#03a9e7]" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Matching Results</div>
                <div className="text-lg font-semibold text-[#052d4a]">{filteredPackages.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-[#03a9e7] bg-opacity-10 rounded-lg flex items-center justify-center">
              <Filter className="h-4 w-4 text-[#03a9e7]" />
            </div>
            <h2 className="text-lg font-medium text-[#052d4a]">Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="border-gray-300 focus:border-[#03a9e7] focus:ring-[#03a9e7]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="xl:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-10 border-gray-300 focus:border-[#03a9e7] focus:ring-[#03a9e7]"
                  placeholder="Search packages or banks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="number"
                min={0}
                className="pl-10 border-gray-300 focus:border-[#03a9e7] focus:ring-[#03a9e7]"
                placeholder="Loan Amount"
                value={minLoanFilter}
                onChange={e => setMinLoanFilter(e.target.value)}
              />
            </div>
            
            <Select value={bankFilter} onValueChange={setBankFilter}>
              <SelectTrigger className="border-gray-300 focus:border-[#03a9e7] focus:ring-[#03a9e7]">
                <SelectValue placeholder="All Banks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Banks</SelectItem>
                {uniqueBanks.map(bank => (
                  <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
              <SelectTrigger className="border-gray-300 focus:border-[#03a9e7] focus:ring-[#03a9e7]">
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniquePropertyTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={lockinFilter} onValueChange={setLockinFilter}>
              <SelectTrigger className="border-gray-300 focus:border-[#03a9e7] focus:ring-[#03a9e7]">
                <SelectValue placeholder="Lock-in Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Periods</SelectItem>
                {uniqueLockinPeriods.map(period => (
                  <SelectItem key={period} value={period}>{period}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortBy(field);
              setSortOrder(order as "asc" | "desc");
            }}>
              <SelectTrigger className="border-gray-300 focus:border-[#03a9e7] focus:ring-[#03a9e7]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_updated-desc">Latest Updated</SelectItem>
                <SelectItem value="last_updated-asc">Oldest Updated</SelectItem>
                <SelectItem value="min_loan_size-asc">Loan Size (Low to High)</SelectItem>
                <SelectItem value="min_loan_size-desc">Loan Size (High to Low)</SelectItem>
                <SelectItem value="bank-asc">Bank (A-Z)</SelectItem>
                <SelectItem value="bank-desc">Bank (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-[#052d4a]">
              Results ({filteredPackages.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {paginatedPackages.map((pkg, idx) => {
              const isMostRelevant = idx === 0 && minLoanFilter && !isNaN(Number(minLoanFilter));

              return (
                <Card
                  key={pkg.id}
                  className={`bg-white border transition-shadow hover:shadow-md ${
                    isMostRelevant ? 'border-[#03a9e7]' : 'border-gray-200'
                  }`}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <img
                            src="https://theloanconnection.com.sg/wp-content/uploads/2025/02/TLC-Square-1.png"
                            alt="TLC Logo"
                            className="w-8 h-8 rounded bg-white p-1 border"
                            style={{objectFit:'contain'}}
                          />
                          <Badge variant="outline" className="border-[#052d4a] text-[#052d4a]">
                            {pkg.bank}
                          </Badge>
                          <Badge variant="outline" className="border-gray-300">
                            {pkg.property_type}
                          </Badge>
                          <Badge variant="outline" className="border-gray-300">
                            {pkg.lockin_period}
                          </Badge>
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                            {pkg.category}
                          </Badge>
                          
                          {/* Feature badges */}
                          {pkg.features && (
                            <>
                              {/best rate|lowest rate/i.test(pkg.features) && (
                                <Badge className="bg-[#03a9e7] text-white">
                                  Best Rate
                                </Badge>
                              )}
                              {/exclusive|high net worth|premium/i.test(pkg.features) && (
                                <Badge className="bg-[#ee3238] text-white">
                                  Exclusive
                                </Badge>
                              )}
                            </>
                          )}
                          
                          {isMostRelevant && (
                            <Badge className="bg-[#052d4a] text-white">
                              Best Match
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg text-[#052d4a]">
                          {pkg.package_name}
                        </CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-[#03a9e7] hover:bg-gray-50"
                          onClick={() => handleEdit(pkg)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-[#ee3238] hover:bg-gray-50"
                          onClick={() => handleDelete(pkg.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Minimum Loan Size</div>
                      <div className="text-xl font-semibold text-[#052d4a]">
                        {formatCurrency(pkg.min_loan_size)}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-[#052d4a] mb-2">Interest Rates</div>
                      <div className="space-y-1">{formatRates(pkg.rates)}</div>
                    </div>

                    {pkg.features && (
                      <div>
                        <div className="text-sm font-medium text-[#052d4a] mb-2">Key Features</div>
                        <div className="space-y-1">{formatFeatures(pkg.features)}</div>
                      </div>
                    )}

                    {pkg.subsidies && (
                      <div>
                        <div className="text-sm font-medium text-[#052d4a] mb-1">Subsidies</div>
                        <div className="text-sm text-gray-600">{pkg.subsidies}</div>
                      </div>
                    )}

                    {pkg.remarks && (
                      <div>
                        <div className="text-sm font-medium text-[#052d4a] mb-1">Remarks</div>
                        <div className="text-sm text-gray-600">{pkg.remarks}</div>
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        Updated: {new Date(pkg.last_updated).toLocaleDateString('en-SG')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="bg-white border border-gray-200 rounded-lg p-1">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={e => {
                          e.preventDefault();
                          setCurrentPage(p => Math.max(1, p - 1));
                        }}
                        aria-disabled={currentPage === 1}
                        className={currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      const page = i + 1;
                      return (
                        <PaginationItem key={i}>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === page}
                            onClick={e => {
                              e.preventDefault();
                              setCurrentPage(page);
                            }}
                            className={currentPage === page ? "bg-[#03a9e7] text-white" : "hover:bg-gray-50"}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={e => {
                          e.preventDefault();
                          setCurrentPage(p => Math.min(totalPages, p + 1));
                        }}
                        aria-disabled={currentPage === totalPages}
                        className={currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredPackages.length === 0 && (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <div className="text-lg font-medium text-[#052d4a] mb-2">
                  No mortgage packages found
                </div>
                <div className="text-gray-600 mb-4">
                  Try adjusting your filters or search terms
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setBankFilter("all");
                    setPropertyTypeFilter("all");
                    setLockinFilter("all");
                    setCategoryFilter("all");
                    setMinLoanFilter("");
                  }}
                  className="border-[#03a9e7] text-[#03a9e7] hover:bg-[#03a9e7] hover:text-white"
                >
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#052d4a] text-white mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img
                src="https://theloanconnection.com.sg/wp-content/uploads/2025/02/TLC-Square-1.png"
                alt="The Loan Connection Logo"
                className="w-10 h-10 rounded bg-white p-1"
                style={{objectFit:'contain'}}
              />
              <div className="text-lg font-medium">The Loan Connection</div>
            </div>
            <div className="border-t border-gray-600 pt-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-400">
                  © 2025 The Loan Connection. All rights reserved.
                </div>
                <div className="text-sm text-gray-400">
                  Powered by The Loan Connection
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;