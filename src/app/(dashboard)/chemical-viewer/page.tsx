"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Loader2, AlertTriangle, Shield, Eye, Info, Beaker, FlaskConical } from "lucide-react";
import Image from "next/image";

// Lab Equipment with images
const labEquipment = [
  {
    id: "beaker",
    name: "Laboratory Beaker",
    description: "Glass vessel with a flat bottom used for mixing, stirring, and heating liquids",
    category: "Glassware",
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=300&fit=crop",
    uses: ["Mixing solutions", "Heating liquids", "Measuring approximate volumes"],
    safetyNotes: ["Handle hot beakers with tongs", "Check for cracks before use", "Avoid sudden temperature changes"]
  },
  {
    id: "flask",
    name: "Erlenmeyer Flask",
    description: "Conical flask with a narrow neck, ideal for swirling liquids without spillage",
    category: "Glassware",
    imageUrl: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=400&h=300&fit=crop",
    uses: ["Titrations", "Recrystallization", "Culturing microorganisms"],
    safetyNotes: ["Use with heating mantles", "Never heat when sealed", "Allow to cool before handling"]
  },
  {
    id: "test-tube",
    name: "Test Tube",
    description: "Small cylindrical container used for holding and mixing small quantities of substances",
    category: "Glassware",
    imageUrl: "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=400&h=300&fit=crop",
    uses: ["Small-scale reactions", "Sample storage", "Qualitative tests"],
    safetyNotes: ["Use test tube holders when heating", "Point away from yourself and others", "Don't overfill"]
  },
  {
    id: "pipette",
    name: "Pipette",
    description: "Precision instrument for measuring and transferring small volumes of liquid",
    category: "Measurement",
    imageUrl: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400&h=300&fit=crop",
    uses: ["Accurate liquid transfer", "Dispensing reagents", "Serial dilutions"],
    safetyNotes: ["Never pipette by mouth", "Use proper technique", "Calibrate regularly"]
  },
  {
    id: "burette",
    name: "Burette",
    description: "Graduated glass tube with a tap at one end for dispensing precise volumes",
    category: "Measurement",
    imageUrl: "https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=400&h=300&fit=crop",
    uses: ["Titrations", "Precise volume delivery", "Quantitative analysis"],
    safetyNotes: ["Check for leaks", "Ensure tap is closed before filling", "Read at eye level"]
  },
  {
    id: "bunsen-burner",
    name: "Bunsen Burner",
    description: "Gas burner producing a single open gas flame used for heating and sterilization",
    category: "Heating",
    imageUrl: "https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=400&h=300&fit=crop",
    uses: ["Heating substances", "Sterilization", "Flame tests"],
    safetyNotes: ["Tie back hair and loose clothing", "Keep flammables away", "Turn off when not in use"]
  },
  {
    id: "microscope",
    name: "Compound Microscope",
    description: "Optical instrument for viewing small specimens at high magnification",
    category: "Observation",
    imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop",
    uses: ["Cell observation", "Microorganism study", "Tissue analysis"],
    safetyNotes: ["Handle lenses carefully", "Clean with proper materials", "Carry with both hands"]
  },
  {
    id: "petri-dish",
    name: "Petri Dish",
    description: "Shallow cylindrical lidded dish used to culture cells and microorganisms",
    category: "Culture",
    imageUrl: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&h=300&fit=crop",
    uses: ["Bacterial culture", "Cell culture", "Evaporation"],
    safetyNotes: ["Sterilize before use", "Seal properly during incubation", "Dispose in biohazard waste"]
  },
  {
    id: "graduated-cylinder",
    name: "Graduated Cylinder",
    description: "Tall narrow container with volume markings for measuring liquid volumes",
    category: "Measurement",
    imageUrl: "https://images.unsplash.com/photo-1532187643603-ba119ca4109e?w=400&h=300&fit=crop",
    uses: ["Measuring liquid volumes", "Preparing solutions", "Volume determination"],
    safetyNotes: ["Read at meniscus level", "Place on flat surface", "Use appropriate size"]
  },
  {
    id: "thermometer",
    name: "Laboratory Thermometer",
    description: "Instrument for measuring temperature of liquids and gases",
    category: "Measurement",
    imageUrl: "https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=400&h=300&fit=crop",
    uses: ["Temperature monitoring", "Melting point determination", "Reaction monitoring"],
    safetyNotes: ["Handle carefully to avoid breakage", "Never use for stirring", "Check calibration"]
  },
  {
    id: "centrifuge",
    name: "Centrifuge",
    description: "Device that spins samples at high speed to separate components by density",
    category: "Separation",
    imageUrl: "https://images.unsplash.com/photo-1583911860205-72f8ac8ddcbe?w=400&h=300&fit=crop",
    uses: ["Sample separation", "Cell harvesting", "Precipitation"],
    safetyNotes: ["Balance tubes before use", "Close lid securely", "Wait for complete stop"]
  },
  {
    id: "fume-hood",
    name: "Fume Hood",
    description: "Ventilated enclosure for handling hazardous or odorous chemicals safely",
    category: "Safety Equipment",
    imageUrl: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop",
    uses: ["Working with volatile chemicals", "Toxic substance handling", "Reducing exposure"],
    safetyNotes: ["Keep sash at proper height", "Don't block vents", "Check airflow before use"]
  }
];

// Default 12 chemicals that are always visible
const defaultChemicals = [
  {
    name: "Water",
    formula: "H2O",
    molecularWeight: "18.015",
    physicalState: "Liquid",
    iupacName: "oxidane",
    cid: 962,
  },
  {
    name: "Oxygen",
    formula: "O2",
    molecularWeight: "31.999",
    physicalState: "Gas",
    iupacName: "dioxygen",
    cid: 977,
  },
  {
    name: "Carbon Dioxide",
    formula: "CO2",
    molecularWeight: "44.009",
    physicalState: "Gas",
    iupacName: "carbon dioxide",
    cid: 280,
  },
  {
    name: "Methane",
    formula: "CH4",
    molecularWeight: "16.043",
    physicalState: "Gas",
    iupacName: "methane",
    cid: 297,
  },
  {
    name: "Ethanol",
    formula: "C2H5OH",
    molecularWeight: "46.07",
    physicalState: "Liquid",
    iupacName: "ethanol",
    cid: 702,
  },
  {
    name: "Glucose",
    formula: "C6H12O6",
    molecularWeight: "180.16",
    physicalState: "Solid",
    iupacName: "D-glucose",
    cid: 5793,
  },
  {
    name: "Ammonia",
    formula: "NH3",
    molecularWeight: "17.031",
    physicalState: "Gas",
    iupacName: "ammonia",
    cid: 222,
  },
  {
    name: "Sulfuric Acid",
    formula: "H2SO4",
    molecularWeight: "98.079",
    physicalState: "Liquid",
    iupacName: "sulfuric acid",
    cid: 1118,
  },
  {
    name: "Sodium Chloride",
    formula: "NaCl",
    molecularWeight: "58.44",
    physicalState: "Solid",
    iupacName: "sodium chloride",
    cid: 5234,
  },
  {
    name: "Hydrochloric Acid",
    formula: "HCl",
    molecularWeight: "36.46",
    physicalState: "Gas",
    iupacName: "hydrogen chloride",
    cid: 313,
  },
  {
    name: "Acetone",
    formula: "C3H6O",
    molecularWeight: "58.08",
    physicalState: "Liquid",
    iupacName: "propan-2-one",
    cid: 180,
  },
  {
    name: "Benzene",
    formula: "C6H6",
    molecularWeight: "78.11",
    physicalState: "Liquid",
    iupacName: "benzene",
    cid: 241,
  },
];

type Chemical = {
  name: string;
  formula: string;
  molecularWeight: string;
  physicalState: string;
  iupacName: string;
  cid: number;
};

type SafetyData = {
  ghs_classification: string[];
  hazards: string[];
  precautions: string[];
  first_aid: {
    inhalation?: string;
    skin?: string;
    eye?: string;
    ingestion?: string;
  };
  pictograms: string[];
};

type ChemicalDetails = Chemical & {
  safetyData?: SafetyData;
  image2D?: string;
};

export default function ChemicalViewerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Chemical[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedChemical, setSelectedChemical] = useState<ChemicalDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchPubChem(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const searchPubChem = async (query: string) => {
    setIsSearching(true);
    try {
      // Simple direct name search
      const response = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query)}/property/MolecularFormula,MolecularWeight,IUPACName,Title/JSON`
      );
      
      if (!response.ok) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      const data = await response.json();
      const properties = data.PropertyTable?.Properties || [];

      const results: Chemical[] = properties.slice(0, 15).map((prop: any) => ({
        name: prop.Title || prop.IUPACName || prop.MolecularFormula || "Unknown",
        formula: prop.MolecularFormula || "N/A",
        molecularWeight: prop.MolecularWeight ? parseFloat(prop.MolecularWeight).toFixed(3) : "N/A",
        physicalState: "Unknown",
        iupacName: prop.IUPACName || "N/A",
        cid: prop.CID,
      }));

      setSearchResults(results);
    } catch (error) {
      console.error("PubChem search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchChemicalDetails = async (chemical: Chemical) => {
    setIsLoadingDetails(true);
    setSelectedChemical({ ...chemical });
    setDetailsDialogOpen(true);

    try {
      // Fetch GHS classification and safety data
      const safetyResponse = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${chemical.cid}/JSON`
      );
      
      let safetyData: SafetyData = {
        ghs_classification: [],
        hazards: [],
        precautions: [],
        first_aid: {},
        pictograms: [],
      };

      if (safetyResponse.ok) {
        const safetyJson = await safetyResponse.json();
        const sections = safetyJson.Record?.Section || [];
        
        // Extract GHS information
        sections.forEach((section: any) => {
          if (section.TOCHeading === "Safety and Hazards") {
            section.Section?.forEach((subsection: any) => {
              // GHS Classification
              if (subsection.TOCHeading === "GHS Classification") {
                subsection.Information?.forEach((info: any) => {
                  if (info.Name === "GHS Hazard Statements") {
                    info.Value?.StringWithMarkup?.forEach((item: any) => {
                      if (item.String) safetyData.hazards.push(item.String);
                    });
                  }
                  if (info.Name === "Pictogram(s)") {
                    info.Value?.StringWithMarkup?.forEach((item: any) => {
                      if (item.String) safetyData.pictograms.push(item.String);
                    });
                  }
                  if (info.Name === "GHS Precautionary Statements") {
                    info.Value?.StringWithMarkup?.forEach((item: any) => {
                      if (item.String) safetyData.precautions.push(item.String);
                    });
                  }
                });
              }
              
              // First Aid
              if (subsection.TOCHeading === "First Aid Measures") {
                subsection.Information?.forEach((info: any) => {
                  const name = info.Name?.toLowerCase() || "";
                  const value = info.Value?.StringWithMarkup?.[0]?.String || "";
                  
                  if (name.includes("inhalation")) safetyData.first_aid.inhalation = value;
                  if (name.includes("skin")) safetyData.first_aid.skin = value;
                  if (name.includes("eye")) safetyData.first_aid.eye = value;
                  if (name.includes("ingestion")) safetyData.first_aid.ingestion = value;
                });
              }
            });
          }
        });
      }

      setSelectedChemical({
        ...chemical,
        safetyData,
        image2D: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${chemical.cid}/PNG?image_size=large`,
      });
    } catch (error) {
      console.error("Error fetching chemical details:", error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Filter default chemicals based on search term
  const filteredDefaults = useMemo(() => {
    if (!searchTerm.trim()) {
      return defaultChemicals;
    }
    return defaultChemicals.filter(chemical =>
      chemical.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chemical.formula.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Combine filtered defaults with search results (avoid duplicates)
  const displayedChemicals = useMemo(() => {
    if (!searchTerm.trim()) {
      return defaultChemicals;
    }

    // Show filtered defaults first, then unique search results
    const defaultCids = new Set(filteredDefaults.map(c => c.cid));
    const uniqueSearchResults = searchResults.filter(c => !defaultCids.has(c.cid));
    
    return [...filteredDefaults, ...uniqueSearchResults];
  }, [searchTerm, filteredDefaults, searchResults]);

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Lab Viewer</h1>
        <p className="text-muted-foreground">Look up detailed information about chemicals and laboratory equipment.</p>
      </div>
      
      <Tabs defaultValue="chemicals" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="chemicals">
            <FlaskConical className="mr-2 h-4 w-4" />
            Chemicals
          </TabsTrigger>
          <TabsTrigger value="equipment">
            <Beaker className="mr-2 h-4 w-4" />
            Equipment
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="chemicals" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Chemical Database</CardTitle>
              <CardDescription>
                Search for chemicals by name or formula. Results are fetched from PubChem.
              </CardDescription>
              <div className="relative pt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for a chemical..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedChemicals.length > 0 ? (
              displayedChemicals.map((chemical) => (
                <Card key={chemical.cid} className="bg-card hover:shadow-lg transition-shadow animate-in fade-in-0 slide-in-from-bottom-4">
                  <CardHeader>
                    <CardTitle className="text-xl text-primary">{chemical.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <p className="font-medium text-muted-foreground">Formula:</p>
                      <p className="text-right font-mono">{chemical.formula}</p>
                      
                      <p className="font-medium text-muted-foreground">Molecular Weight:</p>
                      <p className="text-right font-mono">{chemical.molecularWeight} g/mol</p>
                      
                      <p className="font-medium text-muted-foreground">Physical State:</p>
                      <p className="text-right">{chemical.physicalState}</p>
                      
                      <p className="font-medium text-muted-foreground col-span-2 pt-2 border-t mt-2">IUPAC Name:</p>
                      <p className="text-sm col-span-2 break-words">{chemical.iupacName}</p>
                      
                      <p className="font-medium text-muted-foreground col-span-2 pt-2 border-t mt-2">PubChem CID:</p>
                      <p className="text-right col-span-2">
                        <a 
                          href={`https://pubchem.ncbi.nlm.nih.gov/compound/${chemical.cid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {chemical.cid}
                        </a>
                      </p>
                    </div>
                    
                    <Dialog open={detailsDialogOpen && selectedChemical?.cid === chemical.cid} onOpenChange={(open) => {
                      setDetailsDialogOpen(open);
                      if (!open) setSelectedChemical(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full mt-4" 
                          variant="outline"
                          onClick={() => fetchChemicalDetails(chemical)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details & Safety
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-2xl">{selectedChemical?.name}</DialogTitle>
                          <DialogDescription className="font-mono text-base">
                            {selectedChemical?.formula} - CID: {selectedChemical?.cid}
                          </DialogDescription>
                        </DialogHeader>
                        
                        {isLoadingDetails ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="ml-3 text-muted-foreground">Loading detailed information...</span>
                          </div>
                        ) : (
                          <Tabs defaultValue="structure" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="structure">
                                <Info className="mr-2 h-4 w-4" />
                                Structure
                              </TabsTrigger>
                              <TabsTrigger value="safety">
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                Safety
                              </TabsTrigger>
                              <TabsTrigger value="precautions">
                                <Shield className="mr-2 h-4 w-4" />
                                Precautions
                              </TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="structure" className="space-y-4 mt-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle>2D Chemical Structure</CardTitle>
                                </CardHeader>
                                <CardContent className="flex justify-center">
                                  {selectedChemical?.image2D ? (
                                    <img 
                                      src={selectedChemical.image2D} 
                                      alt={`2D structure of ${selectedChemical.name}`}
                                      className="max-w-full h-auto border rounded-lg shadow-sm bg-white p-4"
                                      onError={(e) => {
                                        e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><text x="50%" y="50%" text-anchor="middle" fill="%23999">Structure not available</text></svg>';
                                      }}
                                    />
                                  ) : (
                                    <div className="text-center text-muted-foreground py-12">
                                      Structure not available
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                              
                              <Card>
                                <CardHeader>
                                  <CardTitle>Basic Properties</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">IUPAC Name</p>
                                    <p className="text-sm mt-1">{selectedChemical?.iupacName}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Molecular Weight</p>
                                    <p className="text-sm mt-1 font-mono">{selectedChemical?.molecularWeight} g/mol</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Physical State</p>
                                    <p className="text-sm mt-1">{selectedChemical?.physicalState}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Molecular Formula</p>
                                    <p className="text-sm mt-1 font-mono">{selectedChemical?.formula}</p>
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>
                            
                            <TabsContent value="safety" className="space-y-4 mt-4">
                              {selectedChemical?.safetyData?.pictograms && selectedChemical.safetyData.pictograms.length > 0 && (
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                                      GHS Pictograms
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                      {selectedChemical.safetyData.pictograms.map((pictogram, idx) => (
                                        <Badge key={idx} variant="destructive" className="text-sm">
                                          {pictogram}
                                        </Badge>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                              
                              {selectedChemical?.safetyData?.hazards && selectedChemical.safetyData.hazards.length > 0 && (
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                      <AlertTriangle className="h-5 w-5 text-red-500" />
                                      Hazard Statements
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <ul className="space-y-2">
                                      {selectedChemical.safetyData.hazards.map((hazard, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                          <span className="text-red-500 mt-1">•</span>
                                          <span className="text-sm">{hazard}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </CardContent>
                                </Card>
                              )}
                              
                              {(!selectedChemical?.safetyData?.hazards || selectedChemical.safetyData.hazards.length === 0) && (
                                <Alert>
                                  <Info className="h-4 w-4" />
                                  <AlertDescription>
                                    No specific hazard information available from PubChem. Always consult the Safety Data Sheet (SDS) for complete safety information.
                                  </AlertDescription>
                                </Alert>
                              )}
                            </TabsContent>
                            
                            <TabsContent value="precautions" className="space-y-4 mt-4">
                              <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                                    <AlertTriangle className="h-5 w-5" />
                                    Emergency Exposure Guide
                                  </CardTitle>
                                  <CardDescription>What happens if chemical contacts your body and immediate actions to take</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
                                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                      <span className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded text-xs">SPILL/FALL</span>
                                      If Chemical Spills or Falls
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <p className="font-medium text-red-600 dark:text-red-400">What Happens:</p>
                                        <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                                          <li>• Chemical may release vapors/fumes if volatile</li>
                                          <li>• Risk of splash exposure to skin, eyes, or clothing</li>
                                          <li>• Potential for inhalation of hazardous vapors</li>
                                          <li>• Contamination of work surface and nearby items</li>
                                        </ul>
                                      </div>
                                      <div>
                                        <p className="font-medium text-green-600 dark:text-green-400">Immediate Actions:</p>
                                        <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                                          <li>• Alert others in the area immediately</li>
                                          <li>• Evacuate if chemical is highly volatile or toxic</li>
                                          <li>• Ventilate the area (open windows/turn on fume hood)</li>
                                          <li>• Wear appropriate PPE before cleanup</li>
                                          <li>• Use spill kit or absorbent material for containment</li>
                                          <li>• Never use bare hands - always wear chemical-resistant gloves</li>
                                          <li>• Report to supervisor/safety officer</li>
                                          <li>• Dispose of contaminated materials properly</li>
                                        </ul>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
                                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                      <span className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-1 rounded text-xs">SKIN CONTACT</span>
                                      If Chemical Contacts Hands/Skin
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <p className="font-medium text-red-600 dark:text-red-400">What Can Happen:</p>
                                        <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                                          <li>• Chemical burns (redness, blistering, tissue damage)</li>
                                          <li>• Skin irritation, itching, or rash</li>
                                          <li>• Absorption through skin into bloodstream</li>
                                          <li>• Allergic reactions or sensitization</li>
                                          <li>• Defatting of skin (dryness, cracking)</li>
                                          <li>• Discoloration or staining</li>
                                        </ul>
                                      </div>
                                      <div>
                                        <p className="font-medium text-green-600 dark:text-green-400">Immediate Actions:</p>
                                        <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                                          <li>• <strong>Remove contaminated clothing/jewelry immediately</strong></li>
                                          <li>• <strong>Rinse with large amounts of water for at least 15-20 minutes</strong></li>
                                          <li>• Use safety shower if large area affected</li>
                                          <li>• Do NOT use neutralizing agents unless specifically instructed</li>
                                          <li>• Do NOT apply creams or ointments unless advised</li>
                                          <li>• Seek medical attention if irritation persists</li>
                                          <li>• Bring SDS to medical personnel</li>
                                        </ul>
                                      </div>
                                      {selectedChemical?.safetyData?.first_aid?.skin && (
                                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded border-l-4 border-blue-500">
                                          <p className="font-medium text-xs text-blue-700 dark:text-blue-300 mb-1">Specific for {selectedChemical.name}:</p>
                                          <p className="text-xs text-muted-foreground">{selectedChemical.safetyData.first_aid.skin}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
                                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                      <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded text-xs">EYE/FACE CONTACT</span>
                                      If Chemical Contacts Face/Eyes
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <p className="font-medium text-red-600 dark:text-red-400">What Can Happen:</p>
                                        <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                                          <li>• <strong>Eyes:</strong> Severe pain, redness, tearing, blurred vision</li>
                                          <li>• Chemical burns to cornea (can cause permanent damage/blindness)</li>
                                          <li>• Swelling of eyelids and surrounding tissue</li>
                                          <li>• <strong>Face:</strong> Burns, irritation, skin damage</li>
                                          <li>• Risk of inhalation if near nose/mouth</li>
                                          <li>• Potential scarring or permanent tissue damage</li>
                                        </ul>
                                      </div>
                                      <div>
                                        <p className="font-medium text-green-600 dark:text-green-400">Immediate Actions for EYES:</p>
                                        <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                                          <li>• <strong className="text-red-600 dark:text-red-400">THIS IS AN EMERGENCY - ACT IMMEDIATELY!</strong></li>
                                          <li>• <strong>Remove contact lenses if easily removable</strong></li>
                                          <li>• <strong>Flush eyes with water for at least 15-20 minutes continuously</strong></li>
                                          <li>• Use eyewash station or gentle stream of water</li>
                                          <li>• Hold eyelids open to ensure thorough rinsing</li>
                                          <li>• Rinse from inner corner to outer corner</li>
                                          <li>• <strong>SEEK MEDICAL ATTENTION IMMEDIATELY - even if pain subsides</strong></li>
                                          <li>• Continue rinsing while waiting for medical help</li>
                                          <li>• Do NOT rub eyes</li>
                                        </ul>
                                      </div>
                                      <div>
                                        <p className="font-medium text-green-600 dark:text-green-400">Immediate Actions for FACE:</p>
                                        <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                                          <li>• <strong>Rinse face with large amounts of water for 15 minutes</strong></li>
                                          <li>• Keep eyes closed if not directly affected</li>
                                          <li>• Remove contaminated clothing carefully</li>
                                          <li>• If chemical is near mouth, rinse mouth with water (do NOT swallow)</li>
                                          <li>• Seek medical attention for severe burns or persistent pain</li>
                                        </ul>
                                      </div>
                                      {selectedChemical?.safetyData?.first_aid?.eye && (
                                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded border-l-4 border-blue-500">
                                          <p className="font-medium text-xs text-blue-700 dark:text-blue-300 mb-1">Specific for {selectedChemical.name}:</p>
                                          <p className="text-xs text-muted-foreground">{selectedChemical.safetyData.first_aid.eye}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
                                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                      <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded text-xs">INHALATION</span>
                                      If Chemical Vapors Are Inhaled
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <p className="font-medium text-red-600 dark:text-red-400">What Can Happen:</p>
                                        <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                                          <li>• Respiratory irritation (coughing, throat irritation)</li>
                                          <li>• Difficulty breathing or shortness of breath</li>
                                          <li>• Dizziness, headache, nausea</li>
                                          <li>• Chemical pneumonitis (lung inflammation)</li>
                                          <li>• Loss of consciousness in severe cases</li>
                                          <li>• Long-term lung damage with prolonged exposure</li>
                                        </ul>
                                      </div>
                                      <div>
                                        <p className="font-medium text-green-600 dark:text-green-400">Immediate Actions:</p>
                                        <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                                          <li>• <strong>Move to fresh air immediately</strong></li>
                                          <li>• Alert others to evacuate if needed</li>
                                          <li>• Loosen tight clothing around neck/chest</li>
                                          <li>• Sit upright to ease breathing</li>
                                          <li>• If breathing is difficult, seek medical attention immediately</li>
                                          <li>• If not breathing, call emergency services and start CPR if trained</li>
                                          <li>• Do NOT give anything by mouth if unconscious</li>
                                        </ul>
                                      </div>
                                      {selectedChemical?.safetyData?.first_aid?.inhalation && (
                                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded border-l-4 border-blue-500">
                                          <p className="font-medium text-xs text-blue-700 dark:text-blue-300 mb-1">Specific for {selectedChemical.name}:</p>
                                          <p className="text-xs text-muted-foreground">{selectedChemical.safetyData.first_aid.inhalation}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                              
                              {selectedChemical?.safetyData?.precautions && selectedChemical.safetyData.precautions.length > 0 && (
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                      <Shield className="h-5 w-5 text-blue-500" />
                                      Precautionary Statements
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <ul className="space-y-2">
                                      {selectedChemical.safetyData.precautions.map((precaution, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                          <span className="text-blue-500 mt-1">•</span>
                                          <span className="text-sm">{precaution}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </CardContent>
                                </Card>
                              )}
                              
                              {(!selectedChemical?.safetyData?.precautions || selectedChemical.safetyData.precautions.length === 0) && (
                                <Alert>
                                  <Info className="h-4 w-4" />
                                  <AlertDescription>
                                    No specific precautionary statements available from PubChem. Always follow standard laboratory safety procedures and consult the Safety Data Sheet (SDS).
                                  </AlertDescription>
                                </Alert>
                              )}
                              
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-sm">General Laboratory Safety Guidelines</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                      <span className="text-primary mt-1">•</span>
                                      <span>Always wear appropriate personal protective equipment (PPE): lab coat, safety goggles, and gloves</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <span className="text-primary mt-1">•</span>
                                      <span>Work in a well-ventilated area or fume hood when handling volatile or hazardous chemicals</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <span className="text-primary mt-1">•</span>
                                      <span>Never eat, drink, or apply cosmetics in the laboratory</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <span className="text-primary mt-1">•</span>
                                      <span>Label all containers clearly and properly</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <span className="text-primary mt-1">•</span>
                                      <span>Know the location of safety equipment: eyewash station, safety shower, fire extinguisher, and first aid kit</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <span className="text-primary mt-1">•</span>
                                      <span>Dispose of chemical waste according to institutional guidelines</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <span className="text-primary mt-1">•</span>
                                      <span>Consult the Safety Data Sheet (SDS) before handling any chemical</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <span className="text-primary mt-1">•</span>
                                      <span><strong>In case of emergency:</strong> Call emergency services (911) and your institution's safety officer immediately</span>
                                    </li>
                                  </ul>
                                </CardContent>
                              </Card>
                            </TabsContent>
                          </Tabs>
                        )}
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-lg text-muted-foreground">
                  {isSearching ? "Searching..." : `No chemicals found for "${searchTerm}"`}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
        </TabsContent>
        
        <TabsContent value="equipment" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Laboratory Equipment</CardTitle>
              <CardDescription>
                Common laboratory equipment with images, descriptions, and safety guidelines.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {labEquipment.map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video relative bg-muted">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <Badge variant="outline" className="shrink-0">{item.category}</Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {item.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <Info className="h-4 w-4 text-primary" />
                          Common Uses
                        </h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {item.uses.map((use, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>{use}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <Shield className="h-4 w-4 text-orange-500" />
                          Safety Notes
                        </h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {item.safetyNotes.map((note, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-orange-500 mt-1">•</span>
                              <span>{note}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}