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
        
        // Check existing respondents by NAME (not token)
        const { data: existing } = await supabase
          .from("preview_sessions" as any)
          .select("name, session_token")
          .in('source', ['survey_oct_2024', 'admin_csv_upload']);

        // Check by NAME not token
        const existingNames = new Set(
          existing?.map((r: any) => r.name.toLowerCase().trim()) || []
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

          // Keep unique token but check name for duplicates
          const token = `survey_${row.Name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
          const isDuplicate = existingNames.has(row.Name.toLowerCase().trim());
          
          console.log(`${row.Name}: ${isDuplicate ? 'DUPLICATE ⚠️' : 'NEW ✅'}`);

          parsed.push({
            name: row.Name,
            contactMethod: row["Contact Method"] || "email",
            contact: row.Contact,
            vendors,
            isDuplicate,
            selected: true, // Allow selecting both new and duplicates
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
        let sessionId: string;
        let token: string;

        console.log("Processing person:", {
          name: person.name,
          isDuplicate: person.isDuplicate,
          vendorCount: person.vendors.length
        });

        if (person.isDuplicate) {
          // Find existing session by name
          const { data: existingSession, error: findError } = await supabase
            .from("preview_sessions" as any)
            .select("id, session_token")
            .eq("name", person.name)
            .in('source', ['survey_oct_2024', 'admin_csv_upload'])
            .single();

          if (findError || !existingSession) {
            console.error('Could not find existing session for:', person.name);
            throw new Error(`Could not find existing session for ${person.name}`);
          }

          sessionId = (existingSession as any).id;
          token = (existingSession as any).session_token;
          console.log(`UPDATE: Adding ${person.vendors.length} vendors to existing session for ${person.name}`);
        } else {
          // Create new session
          token = `survey_${person.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
          
          const { data: responseData, error: respError } = await supabase
            .from("preview_sessions" as any)
            .insert({
              session_token: token,
              name: person.name,
              email: person.contactMethod?.toLowerCase() === "email" ? person.contact : null,
              address: "The Bridges, Delray Beach, FL",
              normalized_address: "the bridges delray beach fl",
              community: "The Bridges",
              source: "admin_csv_upload",
              metadata: {
                phone: person.contactMethod?.toLowerCase() === "phone" ? person.contact : null,
                contact_method: person.contactMethod,
                from_survey: true,
                upload_batch: batchId,
                upload_date: new Date().toISOString(),
              },
            })
            .select()
            .single();

          if (respError) {
            console.error('Insert response error:', respError);
            throw respError;
          }
          
          if (!responseData) {
            throw new Error("Failed to create response");
          }

          sessionId = (responseData as any).id as string;
          console.log(`NEW: Created session for ${person.name}`);
        }

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
        description: `Imported ${selected.length} respondents. Refreshing...`,
      });
      
      // Auto-refresh page to show new data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
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
  const updateCount = parsedData.filter(p => p.isDuplicate && p.selected).length;
  const totalVendors = parsedData
    .filter(p => p.selected)
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
            <DialogTitle>
              Preview - {newCount} New, {updateCount} Updates Found
            </DialogTitle>
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
                />
                <div className="flex-1">
                  <div className="font-medium">{person.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {person.contactMethod}: {person.contact}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {person.isDuplicate 
                      ? `Will add ${person.vendors.length} vendor${person.vendors.length !== 1 ? 's' : ''} to existing`
                      : `${person.vendors.length} vendor${person.vendors.length !== 1 ? 's' : ''}`
                    }
                  </div>
                </div>
                <Badge variant={person.isDuplicate ? "secondary" : "default"}>
                  {person.isDuplicate ? "🔄 UPDATE" : "✅ NEW"}
                </Badge>
              </div>
            ))}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex-1 text-sm text-muted-foreground">
              Summary: {newCount} new, {updateCount} updates ({totalVendors} total vendors)
            </div>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={isUploading || (newCount + updateCount === 0)}>
              {isUploading ? "Processing..." : `Import ${newCount + updateCount} Respondent${newCount + updateCount !== 1 ? 's' : ''}`}
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
