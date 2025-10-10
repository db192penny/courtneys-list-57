import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, Upload, Copy } from "lucide-react";
import Papa from "papaparse";

interface CSVUploadProps {
  onUploadSuccess: () => void;
}

interface ParsedRespondent {
  name: string;
  contactMethod: string;
  contact: string;
  vendors: Array<{ name: string; category: string }>;
  isDuplicate: boolean;
  selected: boolean;
}

export function CSVUpload({ onUploadSuccess }: CSVUploadProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedRespondent[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedLinks, setUploadedLinks] = useState<Array<{ name: string; token: string }>>([]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    Papa.parse(selectedFile, {
      header: true,
      complete: async (results) => {
        console.log("=== CSV DEBUG ===");
        console.log("Total rows:", results.data.length);
        console.log("First row raw data:", results.data[0]);
        console.log("Column names found:", Object.keys(results.data[0] || {}));
        console.log("Sample Contact value:", (results.data[0] as any)?.["Contact"]);
        console.log("Sample Contact Method:", (results.data[0] as any)?.["Contact Method"]);
        
        const parsed: ParsedRespondent[] = [];
        
        // Check existing respondents by session_token
        const { data: existing } = await supabase
          .from("preview_sessions" as any)
          .select("session_token");

        const existingSet = new Set(
          existing?.map((r: any) => r.session_token) || []
        );

        results.data.forEach((row: any) => {
          if (!row.Name || !row.Contact) return;

          console.log(`Processing ${row.Name}:`, {
            contact: row.Contact,
            contactMethod: row["Contact Method"],
            poolService: row["Pool Service"],
            additionalVendors: row["Additional Vendors Summary"]
          });

          const vendors: Array<{ name: string; category: string }> = [];
          
          // Extract vendors from category columns
          const categories = [
            "Pool Service", "HVAC", "Landscaping", "Pest Control",
            "Electrician", "Plumber", "Handyman"
          ];
          
          categories.forEach(category => {
            let vendorValue = row[category];
            if (vendorValue && vendorValue.trim()) {
              // Remove "Other: " prefix if present
              if (vendorValue.startsWith("Other:")) {
                vendorValue = vendorValue.substring(6).trim();
              }
              // Skip "No selection" entries
              if (vendorValue.toLowerCase() !== "no selection" && vendorValue !== "") {
                vendors.push({ name: vendorValue, category });
              }
            }
          });

          // Parse additional vendors if present
          if (row["Additional Vendors Summary"] && row["Additional Vendors Summary"].trim()) {
            // Split by pipe |
            const additionalVendors = row["Additional Vendors Summary"].split("|");
            additionalVendors.forEach((entry: string) => {
              const colonIndex = entry.indexOf(":");
              if (colonIndex > -1) {
                const category = entry.substring(0, colonIndex).trim();
                const vendorName = entry.substring(colonIndex + 1).trim();
                if (vendorName && category) {
                  vendors.push({ name: vendorName, category });
                }
              }
            });
          }

          const token = `survey_${row.Name.toLowerCase().replace(/\s+/g, '_')}_2024`;
          const isDuplicate = existingSet.has(token);

          parsed.push({
            name: row.Name,
            contactMethod: row["Contact Method"] || "email",
            contact: row.Contact,
            vendors,
            isDuplicate,
            selected: !isDuplicate,
          });
        });

        setParsedData(parsed);
        setShowPreview(true);
      },
    });
  };

  const toggleSelection = (index: number) => {
    setParsedData(prev => 
      prev.map((item, i) => i === index ? { ...item, selected: !item.selected } : item)
    );
  };

  const handleImport = async () => {
    const selected = parsedData.filter(p => p.selected);
    if (selected.length === 0) {
      toast({ title: "No respondents selected", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const links: Array<{ name: string; token: string }> = [];
    const batchId = `batch_${Date.now()}`;

    try {
      for (const person of selected) {
        const token = `survey_${person.name.toLowerCase().replace(/\s+/g, '_')}_2024`;
        
        console.log("Inserting person:", {
          name: person.name,
          contact: person.contact,
          contactMethod: person.contactMethod,
          vendorCount: person.vendors.length
        });
        
        // Step 1: Insert preview session with proper error handling
        const { data: responseData, error: respError } = await supabase
          .from("preview_sessions" as any)
          .insert({
            session_token: token,
            name: person.name,
            email: person.contactMethod === "Email" ? person.contact : null,
            address: "The Bridges, Delray Beach, FL",
            normalized_address: "the bridges delray beach fl",
            community: "The Bridges",
            source: "admin_csv_upload",
            metadata: {
              phone: person.contactMethod === "Phone" ? person.contact : null,
              contact_method: person.contactMethod,
              from_survey: true,
              upload_batch: batchId,
              upload_date: new Date().toISOString(),
            },
          })
          .select()
          .single();

        // Check for errors BEFORE accessing .id
        if (respError) {
          console.error('Insert response error:', respError);
          throw respError;
        }
        
        if (!responseData) {
          throw new Error("Failed to create response");
        }

        // NOW safe to use responseData.id with type assertion
        const sessionId = (responseData as any).id as string;

        // Step 2: Insert pending ratings using the session ID
        const vendorInserts = person.vendors.map(v => ({
          session_id: sessionId,
          vendor_name: v.name,
          category: v.category,
          rated: false,
        }));

        if (vendorInserts.length > 0) {
          const { error: vendError } = await supabase
            .from("survey_pending_ratings" as any)
            .insert(vendorInserts);

          if (vendError) {
            console.error('Insert vendors error:', vendError);
            throw vendError;
          }
        }

        links.push({ name: person.name, token });
      }

      setUploadedLinks(links);
      setShowPreview(false);
      setShowSuccessDialog(true);
      setFile(null);
      onUploadSuccess();
      
      toast({
        title: "Import successful!",
        description: `Imported ${selected.length} respondents`,
      });
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: "An error occurred during import",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const copyLink = (token: string) => {
    const link = `https://courtneys-list.com/bridges/rate-vendors?token=${token}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link copied!" });
  };

  const copyAllLinks = () => {
    const allLinks = uploadedLinks
      .map(l => `${l.name}: https://courtneys-list.com/bridges/rate-vendors?token=${l.token}`)
      .join('\n');
    navigator.clipboard.writeText(allLinks);
    toast({ title: "All links copied!" });
  };

  const newCount = parsedData.filter(p => !p.isDuplicate && p.selected).length;
  const totalVendors = parsedData
    .filter(p => !p.isDuplicate && p.selected)
    .reduce((sum, p) => sum + p.vendors.length, 0);

  return (
    <>
      <Card className="mb-6">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between h-auto py-4">
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                📤 Upload New Survey Responses
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  CSV should include: Name, Contact Method, Contact, Pool Service, HVAC, Landscaping, etc.
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Preview - {newCount} New Respondents Found</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-2">
            {parsedData.map((person, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  person.isDuplicate ? 'bg-muted/50' : 'bg-background'
                }`}
              >
                <Checkbox
                  checked={person.selected}
                  onCheckedChange={() => toggleSelection(idx)}
                  disabled={person.isDuplicate}
                />
                <div className="flex-1">
                  <div className="font-medium">{person.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {person.contactMethod}: {person.contact} | {person.vendors.length} vendors
                  </div>
                </div>
                <Badge variant={person.isDuplicate ? "destructive" : "default"}>
                  {person.isDuplicate ? "⚠️ DUPLICATE" : "✅ NEW"}
                </Badge>
              </div>
            ))}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex-1 text-sm text-muted-foreground">
              Summary: {newCount} new people ({totalVendors} vendors) | {parsedData.filter(p => p.isDuplicate).length} duplicates (will skip)
            </div>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={isUploading || newCount === 0}>
              {isUploading ? "Importing..." : `Import ${newCount} New People`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>✅ Successfully imported {uploadedLinks.length} respondents!</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-3">
            {uploadedLinks.map((link, idx) => (
              <div key={idx} className="p-3 border rounded-lg space-y-2">
                <div className="font-medium">{link.name}</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                    courtneys-list.com/bridges/rate-vendors?token={link.token}
                  </code>
                  <Button size="sm" variant="outline" onClick={() => copyLink(link.token)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={copyAllLinks}>
              <Copy className="h-4 w-4 mr-2" />
              Copy All Links
            </Button>
            <Button onClick={() => setShowSuccessDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
