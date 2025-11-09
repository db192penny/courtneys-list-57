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
import { normalizeCommunityName } from "@/utils/communityNormalization";

interface CSVUploadProps {
  onUploadSuccess: () => void;
}

interface ParsedRespondent {
  name: string;
  contactMethod: string;
  contact: string;
  community: string;
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
  const [uploadedLinks, setUploadedLinks] = useState<Array<{ name: string; token: string; community: string }>>([]);
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
            community: row.Community,
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

          // Normalize community name for consistent storage
          const normalizedCommunity = normalizeCommunityName(row.Community);

          parsed.push({
            name: row.Name,
            contactMethod: row["Contact Method"] || "email",
            contact: row.Contact,
            community: normalizedCommunity.displayName,
            vendors,
            isDuplicate,
            selected: false, // Default to unchecked
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

  const selectAllNew = () => {
    setParsedData(prev => 
      prev.map(item => item.isDuplicate ? item : { ...item, selected: true })
    );
  };

  const deselectAllNew = () => {
    setParsedData(prev => 
      prev.map(item => item.isDuplicate ? item : { ...item, selected: false })
    );
  };

  const selectAllDuplicates = () => {
    setParsedData(prev => 
      prev.map(item => !item.isDuplicate ? item : { ...item, selected: true })
    );
  };

  const deselectAllDuplicates = () => {
    setParsedData(prev => 
      prev.map(item => !item.isDuplicate ? item : { ...item, selected: false })
    );
  };

  const handleImport = async () => {
    const selected = parsedData.filter(p => p.selected);
    if (selected.length === 0) {
      toast({ title: "No respondents selected", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const links: Array<{ name: string; token: string; community: string }> = [];
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

          // Update existing session with normalized community and contact info
          const { error: updateError } = await supabase
            .from("preview_sessions" as any)
            .update({
              community: person.community,
              address: `${person.community}, Delray Beach, FL`,
              normalized_address: person.community.toLowerCase().replace(/\s+/g, ' '),
              email: person.contactMethod?.toLowerCase() === "email" ? person.contact : null,
              metadata: {
                phone: person.contactMethod?.toLowerCase() === "phone" ? person.contact : null,
                contact_method: person.contactMethod,
                from_survey: true,
                last_updated: new Date().toISOString(),
              },
            })
            .eq("id", sessionId);

          if (updateError) {
            console.error('Update session error:', updateError);
            throw updateError;
          }

          console.log(`UPDATE: Normalized community to "${person.community}" and adding ${person.vendors.length} vendors for ${person.name}`);
        } else {
          // Create new session
          token = `survey_${person.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
          
          const { data: responseData, error: respError } = await supabase
            .from("preview_sessions" as any)
            .insert({
              session_token: token,
              name: person.name,
              email: person.contactMethod?.toLowerCase() === "email" ? person.contact : null,
              address: `${person.community}, Delray Beach, FL`,
              normalized_address: person.community.toLowerCase().replace(/\s+/g, ' '),
              community: person.community,
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

        links.push({ name: person.name, token, community: person.community });
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

  const copyLink = (token: string, community: string) => {
    const communityToSlug: Record<string, string> = {
      'Boca Bridges': 'boca-bridges',
      'The Bridges': 'the-bridges',
      'The Oaks': 'the-oaks',
      'Woodfield Country Club': 'woodfield-country-club',
    };
    const slug = communityToSlug[community] || 'boca-bridges';
    const link = `https://courtneys-list.com/communities/${slug}/rate-vendors?token=${token}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link copied!" });
  };

  const copyAllLinks = () => {
    const communityToSlug: Record<string, string> = {
      'Boca Bridges': 'boca-bridges',
      'The Bridges': 'the-bridges',
      'The Oaks': 'the-oaks',
      'Woodfield Country Club': 'woodfield-country-club',
    };
    const allLinks = uploadedLinks
      .map(l => {
        const slug = communityToSlug[l.community] || 'boca-bridges';
        return `${l.name}: https://courtneys-list.com/communities/${slug}/rate-vendors?token=${l.token}`;
      })
      .join('\n');
    navigator.clipboard.writeText(allLinks);
    toast({ title: "All links copied!" });
  };

  const newEntries = parsedData.filter(p => !p.isDuplicate);
  const duplicateEntries = parsedData.filter(p => p.isDuplicate);
  const newCount = newEntries.filter(p => p.selected).length;
  const updateCount = duplicateEntries.filter(p => p.selected).length;
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
              Preview Import
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* New Entries Section */}
            {newEntries.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg">
                  <div className="font-semibold">
                    New Entries ({newEntries.length})
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {newCount} of {newEntries.length} selected
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={selectAllNew}
                      disabled={newCount === newEntries.length}
                    >
                      Select All New
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={deselectAllNew}
                      disabled={newCount === 0}
                    >
                      Deselect All New
                    </Button>
                  </div>
                </div>
                {newEntries.map((person, idx) => {
                  const originalIdx = parsedData.indexOf(person);
                  return (
                    <div
                      key={originalIdx}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-background"
                    >
                      <Checkbox
                        checked={person.selected}
                        onCheckedChange={() => toggleSelection(originalIdx)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{person.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {person.contactMethod}: {person.contact}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">
                          {person.vendors.length} vendor{person.vendors.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <Badge variant="default">✅ NEW</Badge>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Duplicates Section */}
            {duplicateEntries.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg">
                  <div className="font-semibold">
                    Duplicates ({duplicateEntries.length})
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {updateCount} of {duplicateEntries.length} selected
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={selectAllDuplicates}
                      disabled={updateCount === duplicateEntries.length}
                    >
                      Select All Duplicates
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={deselectAllDuplicates}
                      disabled={updateCount === 0}
                    >
                      Deselect All Duplicates
                    </Button>
                  </div>
                </div>
                {duplicateEntries.map((person, idx) => {
                  const originalIdx = parsedData.indexOf(person);
                  return (
                    <div
                      key={originalIdx}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50"
                    >
                      <Checkbox
                        checked={person.selected}
                        onCheckedChange={() => toggleSelection(originalIdx)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{person.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {person.contactMethod}: {person.contact}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">
                          Will add {person.vendors.length} vendor{person.vendors.length !== 1 ? 's' : ''} to existing
                        </div>
                      </div>
                      <Badge variant="secondary">🔄 UPDATE</Badge>
                    </div>
                  );
                })}
              </div>
            )}
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
                  <Button size="sm" variant="outline" onClick={() => copyLink(link.token, link.community)}>
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
