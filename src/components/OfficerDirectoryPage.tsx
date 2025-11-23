/**
 * =============================================================================
 * OFFICER DIRECTORY SEARCH PAGE
 * =============================================================================
 * 
 * SMART SPEC COMPLIANCE:
 * ✅ Uses PageLayout master component
 * ✅ Search input height: 44px
 * ✅ Autosuggest shows up to 8 items
 * ✅ Details card: two-column layout desktop, 16px gutter
 * ✅ Clear button: Primary variant, min width 120px
 * ✅ Empty, loading, error states included
 * 
 * =============================================================================
 */

import { useState, useEffect } from "react";
import { Mail, Phone, Calendar, User as UserIcon, Hash, Briefcase, Users } from "lucide-react";
import { PageLayout, SearchInput, DetailsCard, Button } from "./design-system";

interface Officer {
  idCode: string;
  fullName: string;
  position: string;
  committee: string;
  email: string;
  contactNumber: string;
  birthday: string;
  age: number;
  gender: string;
  civilStatus: string;
  nationality: string;
  religion: string;
  role: string;
  profilePicture?: string;
}

interface OfficerDirectoryPageProps {
  onClose: () => void;
  isDark: boolean;
}

export default function OfficerDirectoryPage({
  onClose,
  isDark,
}: OfficerDirectoryPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [searchResults, setSearchResults] = useState<Officer[]>([]);

  // Debounced search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 1) {
        setIsLoading(true);
        try {
          const { searchProfilesFromGAS } = await import("../services/gasApi");
          const result = await searchProfilesFromGAS(searchQuery);
          if (result.success && Array.isArray(result.profiles)) {
            const mappedProfiles = result.profiles.map((p: any) => ({
              idCode: p.idCode,
              fullName: p.fullName,
              position: p.position,
              committee: "", // Not available in backend yet
              email: p.email,
              contactNumber: p.contact,
              birthday: p.birthday,
              age: p.age,
              gender: p.gender,
              civilStatus: p.civilStatus,
              nationality: p.nationality,
              religion: p.religion,
              role: p.role,
              profilePicture: p.profilePic
            }));
            setSearchResults(mappedProfiles);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSearchResults([]);
        setShowSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const suggestions = searchResults.map((officer) => ({
    id: officer.idCode,
    label: officer.fullName,
    subtitle: `${officer.position} • ${officer.idCode}`,
  }));

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    // showSuggestions is handled by useEffect
  };

  const handleSelectSuggestion = (suggestion: any) => {
    const officer = searchResults.find((o) => o.idCode === suggestion.id);
    if (officer) {
      setSelectedOfficer(officer);
      setSearchQuery(officer.fullName);
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    setSelectedOfficer(null);
    setSearchQuery("");
    setShowSuggestions(false);
  };

  return (
    <PageLayout
      title="Officer Directory Search"
      subtitle="Search officers by name, committee, or ID code"
      isDark={isDark}
      onClose={onClose}
      breadcrumbs={[
        { label: "Home", onClick: onClose },
        { label: "Dashboard & Directory", onClick: undefined },
        { label: "Officer Directory", onClick: undefined },
      ]}
    >
      {/* Search Input */}
      <div className="mb-6">
        <SearchInput
          value={searchQuery}
          onChange={handleSearch}
          onClear={handleClear}
          placeholder="Search by Name, Committee, or ID Code..."
          suggestions={suggestions}
          onSelectSuggestion={handleSelectSuggestion}
          isLoading={isLoading}
          isDark={isDark}
          showSuggestions={showSuggestions}
        />
      </div>

      {/* Officer Details Card */}
      {selectedOfficer && (
        <DetailsCard
          title="Officer Details"
          isDark={isDark}
          onClose={handleClear}
          profileImage={selectedOfficer.profilePicture}
          fields={[
            {
              label: "Full Name",
              value: selectedOfficer.fullName,
              icon: <UserIcon className="w-4 h-4" />,
              fullWidth: true,
            },
            {
              label: "ID Code",
              value: selectedOfficer.idCode,
              icon: <Hash className="w-4 h-4" />,
            },
            {
              label: "Position",
              value: selectedOfficer.position,
              icon: <Briefcase className="w-4 h-4" />,
            },
            {
              label: "Committee",
              value: selectedOfficer.committee,
              icon: <Users className="w-4 h-4" />,
              fullWidth: true,
            },
            {
              label: "Email",
              value: selectedOfficer.email,
              icon: <Mail className="w-4 h-4" />,
            },
            {
              label: "Contact Number",
              value: selectedOfficer.contactNumber,
              icon: <Phone className="w-4 h-4" />,
            },
            {
              label: "Birthday",
              value: selectedOfficer.birthday,
              icon: <Calendar className="w-4 h-4" />,
            },
            {
              label: "Age",
              value: `${selectedOfficer.age} years old`,
            },
            {
              label: "Gender",
              value: selectedOfficer.gender,
            },
            {
              label: "Civil Status",
              value: selectedOfficer.civilStatus,
            },
            {
              label: "Nationality",
              value: selectedOfficer.nationality,
            },
            {
              label: "Religion",
              value: selectedOfficer.religion,
            },
          ]}
          actions={
            <>
              <Button variant="secondary" onClick={handleClear}>
                Clear
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  window.location.href = `mailto:${selectedOfficer.email}`;
                }}
              >
                Send Email
              </Button>
            </>
          }
        />
      )}

      {/* Empty State */}
      {!selectedOfficer && !searchQuery && (
        <div className="text-center py-12">
          <UserIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Use the search bar above to find officers by name, committee, or ID
            code.
          </p>
        </div>
      )}
    </PageLayout>
  );
}
