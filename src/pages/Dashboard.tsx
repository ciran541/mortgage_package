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
import { Plus, Search, ArrowUpDown, Edit, Trash2 } from "lucide-react";
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
  const pageSize = 10;
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
    setCurrentPage(1); // Reset to first page on filter change
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

    // If minLoanFilter is set, sort by closest min_loan_size to the entered value (but not exceeding it)
    if (minLoanFilter && !isNaN(Number(minLoanFilter))) {
      const clientLoan = Number(minLoanFilter);
      filtered.sort((a, b) => {
        // Sort descending by min_loan_size (highest eligible first)
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
      <div key={index} className="text-sm">{rate.trim()}</div>
    ));
  };

  const formatFeatures = (features?: string) => {
    if (!features) return null;
    return features.split('<br>').map((feature, index) => (
      <div key={index} className="text-sm text-muted-foreground">{feature.trim()}</div>
    ));
  };

  const uniqueBanks = [...new Set(packages.map(p => p.bank))];
  const uniquePropertyTypes = [...new Set(packages.map(p => p.property_type))];
  const uniqueLockinPeriods = [...new Set(packages.map(p => p.lockin_period))];
  const uniqueCategories = [...new Set(packages.map(p => p.category))];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading mortgage packages...</div>
      </div>
    );
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredPackages.length / pageSize);
  const paginatedPackages = filteredPackages.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
  <div className="min-h-screen bg-background p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Mortgage Package Dashboard</h1>
              <p className="text-muted-foreground">Manage and compare mortgage packages from different banks</p>
            </div>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingPackage(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Package
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
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
          {/* Summary Card */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary">Client Loan Amount:</span>
              <span className="text-lg">{minLoanFilter ? formatCurrency(Number(minLoanFilter)) : "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary">Matching Packages:</span>
              <span className="text-lg">{filteredPackages.length}</span>
            </div>
          </div>
        </div>


  {/* Filters Section */}
  <div className="mb-8 md:sticky md:top-0 z-30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all border-b border-muted shadow-sm px-2 md:px-0 py-4">
          <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            Filter Packages
          </h2>
          <div className="bg-card rounded-xl shadow-sm p-2 sm:p-4 md:p-6 border border-muted flex flex-col gap-4 md:gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-2 sm:gap-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="lg:col-span-2">
                <Input
                  placeholder="Search packages or banks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Input
                  type="number"
                  min={0}
                  placeholder="Client Loan Amount (SGD)"
                  value={minLoanFilter}
                  onChange={e => setMinLoanFilter(e.target.value)}
                />
              </div>
              <Select value={bankFilter} onValueChange={setBankFilter}>
                <SelectTrigger>
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
                <SelectTrigger>
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
                <SelectTrigger>
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
                <SelectTrigger>
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
        </div>

        {/* Results Section */}
        <div className="mb-4 mt-8 flex items-center gap-2">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <ArrowUpDown className="h-6 w-6 text-primary" />
            Results
          </h2>
          <span className="text-base text-muted-foreground">Showing {filteredPackages.length} of {packages.length} packages</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {paginatedPackages.map((pkg, idx) => {
            // Highlight the most relevant packages (top of the list)
            const isMostRelevant = idx === 0 && minLoanFilter && !isNaN(Number(minLoanFilter));
            // Feature badge logic
            let featureBadge = null;
            let featureIcon = null;
            if (pkg.features) {
              if (/best rate|lowest rate/i.test(pkg.features)) {
                featureBadge = 'Best Rate';
                featureIcon = <svg className="inline-block w-4 h-4 mr-1 text-[#03a9e7]" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2l2.39 4.84L18 7.27l-3.91 3.81L15.18 18 10 14.77 4.82 18l1.09-6.92L2 7.27l5.61-.43z"/></svg>;
              } else if (/exclusive|high net worth|premium/i.test(pkg.features)) {
                featureBadge = 'Exclusive';
                featureIcon = <svg className="inline-block w-4 h-4 mr-1 text-[#ee3238]" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8"/></svg>;
              }
            }
            return (
              <Card
                key={pkg.id}
                className={`relative transition-shadow ${isMostRelevant ? 'border-2 border-primary shadow-lg' : ''}`}
              >
                {/* TLC Logo Branding - inline with badges */}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <img
                          src="https://theloanconnection.com.sg/wp-content/uploads/2025/02/TLC-Square-1.png"
                          alt="TLC Logo"
                          className="w-8 h-8 rounded"
                          style={{objectFit:'contain'}}
                        />
                        <Badge variant="outline">{pkg.bank}</Badge>
                        <Badge variant="secondary">{pkg.property_type}</Badge>
                        <Badge variant="outline">{pkg.lockin_period}</Badge>
                        <Badge variant="outline">{pkg.category}</Badge>
                        {featureBadge && (
                          <Badge className="ml-2 flex items-center gap-1 px-2 py-1 text-xs font-semibold" style={{background:'#03a9e7',color:'#fff'}}>
                            {featureIcon}{featureBadge}
                          </Badge>
                        )}
                        {isMostRelevant && (
                          <Badge className="bg-primary text-primary-foreground ml-2 animate-pulse">Most Relevant</Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{pkg.package_name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(pkg)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(pkg.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-1">Minimum Loan Size</div>
                    <div className="text-lg font-semibold">{formatCurrency(pkg.min_loan_size)}</div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1">Interest Rates</div>
                    <div className="space-y-1">{formatRates(pkg.rates)}</div>
                  </div>

                  {pkg.features && (
                    <div>
                      <div className="text-sm font-medium mb-1">Features</div>
                      <div className="space-y-1">{formatFeatures(pkg.features)}</div>
                    </div>
                  )}

                  {pkg.subsidies && (
                    <div>
                      <div className="text-sm font-medium mb-1">Subsidies</div>
                      <div className="text-sm text-muted-foreground">{pkg.subsidies}</div>
                    </div>
                  )}

                  {pkg.remarks && (
                    <div>
                      <div className="text-sm font-medium mb-1">Remarks</div>
                      <div className="text-sm text-muted-foreground">{pkg.remarks}</div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Last updated: {new Date(pkg.last_updated).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
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
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === i + 1}
                      onClick={e => {
                        e.preventDefault();
                        setCurrentPage(i + 1);
                      }}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={e => {
                      e.preventDefault();
                      setCurrentPage(p => Math.min(totalPages, p + 1));
                    }}
                    aria-disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {filteredPackages.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-lg text-muted-foreground">No mortgage packages found</div>
              <div className="text-sm text-muted-foreground mt-1">
                Try adjusting your filters or search terms
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;