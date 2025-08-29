import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Save, X } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const categoryOptions = [
  "Fixed",
  "Floating (Completed)",
  "BUC"
];

const formSchema = z.object({
  bank: z.string().min(1, "Bank is required"),
  property_type: z.string().min(1, "Property type is required"),
  category: z.string().min(1, "Category is required"),
  min_loan_size: z.number().min(1, "Minimum loan size must be greater than 0"),
  package_name: z.string().min(1, "Package name is required"),
  lockin_period: z.string().min(1, "Lock-in period is required"),
  rates: z.string().min(1, "Rates are required"),
  features: z.string().optional(),
  subsidies: z.string().optional(),
  remarks: z.string().optional(),
  last_updated: z.date(),
});

type FormData = z.infer<typeof formSchema>;

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

interface MortgagePackageFormProps {
  package?: MortgagePackage | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const MortgagePackageForm = ({ package: editPackage, onSuccess, onCancel }: MortgagePackageFormProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bank: "",
      property_type: "",
      category: "Fixed",
      min_loan_size: 0,
      package_name: "",
      lockin_period: "",
      rates: "",
      features: "",
      subsidies: "",
      remarks: "",
      last_updated: new Date(),
    },
  });

  useEffect(() => {
    if (editPackage) {
      form.reset({
        bank: editPackage.bank,
        property_type: editPackage.property_type,
        category: editPackage.category || "Fixed",
        min_loan_size: editPackage.min_loan_size,
        package_name: editPackage.package_name,
        lockin_period: editPackage.lockin_period,
        rates: editPackage.rates,
        features: editPackage.features || "",
        subsidies: editPackage.subsidies || "",
        remarks: editPackage.remarks || "",
        last_updated: new Date(editPackage.last_updated),
      });
    } else {
      form.reset({
        bank: "",
        property_type: "",
        category: "Fixed",
        min_loan_size: 0,
        package_name: "",
        lockin_period: "",
        rates: "",
        features: "",
        subsidies: "",
        remarks: "",
        last_updated: new Date(),
      });
    }
  }, [editPackage, form]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const formattedData = {
        bank: data.bank,
        property_type: data.property_type,
        category: data.category,
        min_loan_size: data.min_loan_size,
        package_name: data.package_name,
        lockin_period: data.lockin_period,
        rates: data.rates,
        features: data.features || null,
        subsidies: data.subsidies || null,
        remarks: data.remarks || null,
        last_updated: format(data.last_updated, "yyyy-MM-dd"),
      };

const categoryOptions = [
  "Fixed",
  "Floating (Completed)",
  "BUC"
];

      if (editPackage) {
        const { error } = await supabase
          .from("mortgage_packages")
          .update(formattedData)
          .eq("id", editPackage.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Mortgage package updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("mortgage_packages")
          .insert([formattedData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Mortgage package created successfully",
        });
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving package:", error);
      toast({
        title: "Error",
        description: `Failed to ${editPackage ? "update" : "create"} mortgage package`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const bankOptions = [
    "DBS", "OCBC", "UOB", "POSB", "Maybank", "Standard Chartered", 
    "HSBC", "Citibank", "RHB", "Hong Leong Finance"
  ];

  const propertyTypeOptions = [
    "HDB", "Private", "HDB / Private", "Executive Condominium"
  ];

  const lockinPeriodOptions = [
    "1 Year", "2 Years", "3 Years", "4 Years", "5 Years", "No Lock-in"
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bank"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bank</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a bank" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {bankOptions.map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="property_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {propertyTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="min_loan_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Loan Size (SGD)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="200000"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lockin_period"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lock-in Period</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select lock-in period" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {lockinPeriodOptions.map((period) => (
                      <SelectItem key={period} value={period}>
                        {period}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="package_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Package Name</FormLabel>
              <FormControl>
                <Input placeholder="OCBC 1Y Fixed Rates – 2 Years Lock-In" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rates"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interest Rates</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Year 1: 2.0% Fixed <br> Year 2: 3M SORA + 0.35% <br> Thereafter: 3M SORA + 0.55%"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <div className="text-sm text-muted-foreground">
                Use &lt;br&gt; to separate lines
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="features"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Features (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="- One free conversion after 12 months <br> - 100% Waiver Due to Sale after 12M"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <div className="text-sm text-muted-foreground">
                Use &lt;br&gt; to separate lines
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="subsidies"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subsidies (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Subsidy for refinancing available" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_updated"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Last Updated</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="remarks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Remarks (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Internal notes or additional information"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : editPackage ? "Update Package" : "Create Package"}
          </Button>
        </div>
      </form>
    </Form>
  );
};