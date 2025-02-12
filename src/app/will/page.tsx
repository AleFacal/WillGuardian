// WillGeneratorPage.tsx
"use client";

import "./styles.css";
import { useState, useEffect } from "react";
import { generateWill } from "@/lib/openai"; // your custom function/hook for generating the will text
import PDFDownloadButton from "@/components/PDFDownloadButton";
import { generatePDFApi } from "@/lib/generatePDFApi";
import { CountryKey } from "@/lib/types";

/**
 * CountryLabels used for UI display in different languages/countries.
 */
type CountryLabels = {
  countrySelection: string;
  fullName: string;
  dob: string;
  address: string;
  nationality: string;
  maritalStatus: string;
  executor: string;
  alternateExecutor: string;
  executorInstructions: string;
  specificBequests: string;
  residuaryEstate: string;
  beneficiaries: string;
  funeralInstructions: string;
  legalNotes: string;
  idNumber: string;
  minorChildren?: string;
  guardianName?: string;
  backupGuardianName?: string;
  selfProvingAffidavit?: string;
  usState?: string;
  ukHasMinorChildren?: string;
  ukGuardianName?: string;
  ukBackupGuardian?: string;
  ukAttestationClause?: string;
  deIsHolographic?: string;
  frIsAuthenticWill?: string;
  frIsHolographic?: string;
  esIsNotarialWill?: string;
  esIsHolographic?: string;
  chIsPublicNotarial?: string;
  chIsHolographic?: string;
};

export default function WillGeneratorPage() {
  const [currentStep, setCurrentStep] = useState(1);

  // =========== Universal Fields ==========
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [nationality, setNationality] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [idNumber, setIdNumber] = useState("");

  // =========== Executor Fields ==========
  const [executor, setExecutor] = useState("");
  const [alternateExecutor, setAlternateExecutor] = useState("");
  const [executorInstructions, setExecutorInstructions] = useState(
    "The executor shall act in the best interest of the estate, settle debts, then distribute the remainder."
  );

  // =========== Bequests & Beneficiaries ==========
  const [specificBequests, setSpecificBequests] = useState(
    "My house to John\nMy car to Sarah"
  );
  const [residuaryEstate, setResiduaryEstate] = useState(
    "All remaining assets to my children"
  );
  const [beneficiaries, setBeneficiaries] = useState("");

  // =========== Additional Instructions ==========
  const [funeralInstructions, setFuneralInstructions] = useState(
    "I leave my funeral arrangements to my Executor's discretion."
  );
  const [legalNotes, setLegalNotes] = useState("");

  // =========== US-specific ==========
  const [hasMinorChildren, setHasMinorChildren] = useState(false);
  const [guardianName, setGuardianName] = useState("");
  const [backupGuardianName, setBackupGuardianName] = useState("");
  const [useSelfProvingAffidavit, setUseSelfProvingAffidavit] = useState(false);
  const [usState, setUsState] = useState("");

  // =========== UK-specific ==========
  const [ukHasMinorChildren, setUkHasMinorChildren] = useState(false);
  const [ukGuardianName, setUkGuardianName] = useState("");
  const [ukBackupGuardian, setUkBackupGuardian] = useState("");
  const [ukAttestationClause, setUkAttestationClause] = useState(false);

  // =========== Germany, France, Spain, Switzerland, etc. ==========
  const [deIsHolographic, setDeIsHolographic] = useState(false);
  const [frIsAuthenticWill, setFrIsAuthenticWill] = useState(false);
  const [frIsHolographic, setFrIsHolographic] = useState(false);
  const [esIsNotarialWill, setEsIsNotarialWill] = useState(false);
  const [esIsHolographic, setEsIsHolographic] = useState(false);
  const [chIsPublicNotarial, setChIsPublicNotarial] = useState(false);
  const [chIsHolographic, setChIsHolographic] = useState(false);

  // =========== Country & Language ==========
  const [selectedCountry, setSelectedCountry] = useState<CountryKey>("us");
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  // =========== Generated Output & PDF ==========
  const [willText, setWillText] = useState("");
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [copySuccess, setCopySuccess] = useState("");

  // =========== UI - Country & Language Options ==========
  const countryOptions = [
    { value: "us", label: "United States" },
    { value: "uk", label: "United Kingdom" },
    { value: "de", label: "Germany" },
    { value: "ch", label: "Switzerland" },
    { value: "fr", label: "France" },
    { value: "es", label: "Spain" },
  ];

  const languageOptionsMap: Record<string, string[]> = {
    us: ["English", "Spanish"],
    uk: ["English"],
    de: ["German"],
    ch: ["German", "French", "Italian"],
    fr: ["French"],
    es: ["Spanish"],
  };
  const languageOptions = languageOptionsMap[selectedCountry] || ["English"];

  const countryLabels: Record<CountryKey, CountryLabels> = {
    us: {
      countrySelection: "Country Selection (US)",
      fullName: "Full Name (US)",
      dob: "Date of Birth (YYYY-MM-DD)",
      address: "Residential Address (US)",
      nationality: "Nationality (US)",
      maritalStatus: "Marital Status (US)",
      executor: "Executor (trusted person)",
      alternateExecutor: "Alternate Executor (backup)",
      executorInstructions: "Instructions for the Executor (US)",
      specificBequests: "Specific Bequests (US)",
      residuaryEstate: "Residuary Estate (US)",
      beneficiaries: "Beneficiaries (US)",
      funeralInstructions: "Funeral Instructions (US)",
      legalNotes: "Legal Notes/Revocation Clause (US)",
      idNumber: "Identification Number (US)",
      minorChildren: "Do you have minor children? (US)",
      guardianName: "Guardian Name (US)",
      backupGuardianName: "Backup Guardian (US)",
      selfProvingAffidavit: "Use Self-Proving Affidavit? (US)",
      usState: "State (US)",
    },
    uk: {
      countrySelection: "Country Selection (UK)",
      fullName: "Full Name (UK)",
      dob: "Date of Birth (DD/MM/YYYY)",
      address: "Address (UK)",
      nationality: "Nationality (UK)",
      maritalStatus: "Marital Status (UK)",
      executor: "Executor (UK)",
      alternateExecutor: "Alternate Executor (UK)",
      executorInstructions: "Executor Instructions (UK)",
      specificBequests: "Specific Bequests (UK)",
      residuaryEstate: "Residuary Estate (UK)",
      beneficiaries: "Beneficiaries (UK)",
      funeralInstructions: "Funeral Instructions (UK)",
      legalNotes: "Legal Notes (UK)",
      idNumber: "Identification Number (UK)",
      ukHasMinorChildren: "Do you have minor children? (UK)",
      ukGuardianName: "Guardian Name (UK)",
      ukBackupGuardian: "Backup Guardian (UK)",
      ukAttestationClause: "Need formal attestation clause? (UK)",
    },
    de: {
      countrySelection: "Länderauswahl (DE)",
      fullName: "Vollständiger Name (DE)",
      dob: "Geburtsdatum (TT.MM.JJJJ)",
      address: "Adresse (DE)",
      nationality: "Nationalität (DE)",
      maritalStatus: "Familienstand (DE)",
      executor: "Testamentsvollstrecker (DE)",
      alternateExecutor: "Stellv. Testamentsvollstrecker (DE)",
      executorInstructions: "Anweisungen (DE)",
      specificBequests: "Spezifische Vermächtnisse (DE)",
      residuaryEstate: "Verbleibendes Erbe (DE)",
      beneficiaries: "Begünstigte (DE)",
      funeralInstructions: "Bestattungsanweisungen (DE)",
      legalNotes: "Rechtliche Hinweise (DE)",
      idNumber: "Identifikationsnummer (DE)",
      deIsHolographic: "Is this a fully handwritten (holographic) will? (DE)",
    },
    fr: {
      countrySelection: "Sélection du pays",
      fullName: "Nom complet",
      dob: "Date de naissance (JJ/MM/AAAA)",
      address: "Adresse",
      nationality: "Nationalité",
      maritalStatus: "État civil",
      executor: "Exécuteur testamentaire",
      alternateExecutor: "Exécuteur suppléant",
      executorInstructions: "Instructions",
      specificBequests: "Légats spécifiques",
      residuaryEstate: "Reste de l'héritage",
      beneficiaries: "Bénéficiaires",
      funeralInstructions: "Instructions funéraires",
      legalNotes: "Notes légales",
      idNumber: "Identifiant",
      frIsAuthenticWill: "Testament authentique (notarié)",
      frIsHolographic: "Testament holographique (entièrement manuscrit)",
    },
    es: {
      countrySelection: "Selección de país",
      fullName: "Nombre completo",
      dob: "Fecha de nacimiento (DD/MM/AAAA)",
      address: "Dirección",
      nationality: "Nacionalidad",
      maritalStatus: "Estado civil",
      executor: "Ejecutor del testamento",
      alternateExecutor: "Ejecutor alternativo",
      executorInstructions: "Instrucciones",
      specificBequests: "Legados específicos",
      residuaryEstate: "Resto de la herencia",
      beneficiaries: "Beneficiarios (ES)",
      funeralInstructions: "Instrucciones funerarias",
      legalNotes: "Notas legales",
      idNumber: "Número de identificación",
      esIsNotarialWill: "Testamento notarial",
      esIsHolographic: "Testamento holográfico (entièrement manuscrit)",
    },
    ch: {
      countrySelection: "Länderauswahl (CH)",
      fullName: "Vollständiger Name (CH)",
      dob: "Geburtsdatum (TT.MM.JJJJ)",
      address: "Wohnadresse (CH)",
      nationality: "Nationalität (CH)",
      maritalStatus: "Familienstand (CH)",
      executor: "Testamentsvollstrecker (CH)",
      alternateExecutor: "Stellv. Testamentsvollstrecker (CH)",
      executorInstructions: "Anweisungen (CH)",
      specificBequests: "Spezifische Vermächtnisse (CH)",
      residuaryEstate: "Restvermögen (CH)",
      beneficiaries: "Begünstigte (CH)",
      funeralInstructions: "Bestattungsanweisungen (CH)",
      legalNotes: "Rechtliche Hinweise (CH)",
      idNumber: "ID Nummer (CH)",
      chIsPublicNotarial: "Öffentlich notarielles Testament (Notar + 2 Zeugen)",
      chIsHolographic: "Holographisches Testament (handschriftlich)",
    },
  };

  // On country selection, pick the first available language
  useEffect(() => {
    const lang = languageOptionsMap[selectedCountry]
      ? languageOptionsMap[selectedCountry][0]
      : "English";
    setSelectedLanguage(lang);
  }, [selectedCountry]);

  // Load from local storage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem("willDraft");
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      setFullName(draft.fullName || "");
      setDob(draft.dob || "");
      // Additional fields can be loaded similarly…
    }
  }, []);

  // Save draft to local storage whenever states change
  useEffect(() => {
    const draft = {
      fullName,
      dob,
      address,
      nationality,
      maritalStatus,
      idNumber,
      executor,
      alternateExecutor,
      executorInstructions,
      specificBequests,
      residuaryEstate,
      beneficiaries,
      funeralInstructions,
      legalNotes,
      selectedCountry,
      selectedLanguage,
      hasMinorChildren,
      guardianName,
      backupGuardianName,
      useSelfProvingAffidavit,
      usState,
      ukHasMinorChildren,
      ukGuardianName,
      ukBackupGuardian,
      ukAttestationClause,
      deIsHolographic,
      frIsAuthenticWill,
      frIsHolographic,
      esIsNotarialWill,
      esIsHolographic,
      chIsPublicNotarial,
      chIsHolographic,
    };
    localStorage.setItem("willDraft", JSON.stringify(draft));
    setDraftSaved(true);
    const timeout = setTimeout(() => setDraftSaved(false), 1500);
    return () => clearTimeout(timeout);
  }, [
    fullName,
    dob,
    address,
    nationality,
    maritalStatus,
    idNumber,
    executor,
    alternateExecutor,
    executorInstructions,
    specificBequests,
    residuaryEstate,
    beneficiaries,
    funeralInstructions,
    legalNotes,
    selectedCountry,
    selectedLanguage,
    hasMinorChildren,
    guardianName,
    backupGuardianName,
    useSelfProvingAffidavit,
    usState,
    ukHasMinorChildren,
    ukGuardianName,
    ukBackupGuardian,
    ukAttestationClause,
    deIsHolographic,
    frIsAuthenticWill,
    frIsHolographic,
    esIsNotarialWill,
    esIsHolographic,
    chIsPublicNotarial,
    chIsHolographic,
  ]);

  function clearDraft() {
    localStorage.removeItem("willDraft");
    setFullName("");
    setDob("");
    setAddress("");
    setNationality("");
    setMaritalStatus("");
    setIdNumber("");
    setExecutor("");
    setAlternateExecutor("");
    setExecutorInstructions("");
    setSpecificBequests("");
    setResiduaryEstate("");
    setBeneficiaries("");
    setFuneralInstructions("");
    setLegalNotes("");
    setSelectedCountry("us");
    setSelectedLanguage("English");
    setHasMinorChildren(false);
    setGuardianName("");
    setBackupGuardianName("");
    setUseSelfProvingAffidavit(false);
    setUsState("");
    setUkHasMinorChildren(false);
    setUkGuardianName("");
    setUkBackupGuardian("");
    setUkAttestationClause(false);
    setDeIsHolographic(false);
    setFrIsAuthenticWill(false);
    setFrIsHolographic(false);
    setEsIsNotarialWill(false);
    setEsIsHolographic(false);
    setChIsPublicNotarial(false);
    setChIsHolographic(false);
  }

  const handleNextStep = () => {
    if (currentStep === 3 && !executor.trim()) {
      alert("Executor is required. Please provide an Executor name.");
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = () => setCurrentStep(currentStep - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setLoading(true);

    try {
      // Generate the will text via your OpenAI-based function.
      const text = await generateWill(
        fullName,
        dob,
        address,
        nationality,
        executor,
        alternateExecutor,
        executorInstructions,
        `${specificBequests}\n${residuaryEstate}`,
        beneficiaries,
        "", // Witness data (if any)
        `${funeralInstructions}\n${legalNotes}`,
        selectedCountry,
        selectedLanguage
      );
      setWillText(text);

      // Prepare additional details for the PDF.
      const testatorInfo = { name: fullName, dob, nationality };
      const executorInfo = { executor, backupExecutor: alternateExecutor };
      const bequestsArray = specificBequests.split("\n").filter(Boolean);

      // Call the new API route to generate the PDF.
      const pdf = await generatePDFApi({
        willText: text,
        selectedLanguage,
        selectedCountry,
        testatorInfo,
        executorInfo,
        bequests: bequestsArray,
        funeralInstructions: `${funeralInstructions}\n${legalNotes}`,
      });
      setPdfBytes(pdf);
    } catch (error) {
      console.error("Error generating will:", error);
    }

    setIsGenerating(false);
    setLoading(false);
  };

  // Copy will text to clipboard
  const copyToClipboard = async () => {
    if (!willText) return;
    try {
      await navigator.clipboard.writeText(willText);
      setCopySuccess("Will text copied!");
      setTimeout(() => setCopySuccess(""), 2000);
    } catch {
      setCopySuccess("Failed to copy");
    }
  };

  return (
    <div className="form-box">
      <h1>Legal Last Will & Testament Generator</h1>
      <form onSubmit={handleSubmit} className="form-section">
        {/* STEP 1: Country & Language */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-2 border-b pb-1">
              {countryLabels[selectedCountry].countrySelection}
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <label className="block mb-1 font-bold">
                {countryLabels[selectedCountry].countrySelection}
              </label>
              <select
                value={selectedCountry}
                onChange={(e) =>
                  setSelectedCountry(e.target.value as CountryKey)
                }
                className="input-field"
              >
                {countryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="block mb-1 font-bold mt-4">Language</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="input-field"
            >
              {languageOptions.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
            <div className="buttonContainer single-button mt-4">
              <button
                type="button"
                onClick={handleNextStep}
                className="nextStepButton"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Personal Info */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-xl font-bold mb-2 border-b pb-1">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-bold">
                  {countryLabels[selectedCountry].fullName}
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 font-bold">
                  {countryLabels[selectedCountry].dob}
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block mb-1 font-bold">
                  {countryLabels[selectedCountry].address}
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 font-bold">
                  {countryLabels[selectedCountry].nationality}
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 font-bold">
                  {countryLabels[selectedCountry].maritalStatus}
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 font-bold">
                  {countryLabels[selectedCountry].idNumber}
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                />
              </div>
            </div>
            <div className="buttonContainer mt-4">
              <button
                type="button"
                onClick={handlePreviousStep}
                className="previousStepButton"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="nextStepButton"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Executor Info */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-xl font-bold mb-2 border-b pb-1">
              Executor Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-bold">
                  {countryLabels[selectedCountry].executor}
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={executor}
                  onChange={(e) => setExecutor(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 font-bold">
                  {countryLabels[selectedCountry].alternateExecutor}
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={alternateExecutor}
                  onChange={(e) => setAlternateExecutor(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block mb-1 font-bold">
                  {countryLabels[selectedCountry].executorInstructions}
                </label>
                <textarea
                  className="input-field"
                  value={executorInstructions}
                  onChange={(e) => setExecutorInstructions(e.target.value)}
                />
              </div>
            </div>
            {selectedCountry === "us" && (
              <div className="mt-6 bg-gray-50 border p-4">
                <label className="block font-bold mb-1">
                  {countryLabels.us.minorChildren}
                </label>
                <input
                  type="checkbox"
                  checked={hasMinorChildren}
                  onChange={(e) => setHasMinorChildren(e.target.checked)}
                />
                <span className="ml-2">Yes, I have minor children</span>
                {hasMinorChildren && (
                  <div className="mt-2">
                    <label className="block font-bold">
                      {" "}
                      {countryLabels.us.guardianName}{" "}
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                    />
                    <label className="block font-bold mt-2">
                      {countryLabels.us.backupGuardianName}
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={backupGuardianName}
                      onChange={(e) => setBackupGuardianName(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
            {selectedCountry === "us" && (
              <div className="mt-6">
                <label className="block font-bold mb-1">
                  {countryLabels.us.usState}
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={usState}
                  onChange={(e) => setUsState(e.target.value)}
                />
              </div>
            )}
            <div className="buttonContainer mt-4">
              <button
                type="button"
                onClick={handlePreviousStep}
                className="previousStepButton"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="nextStepButton"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Bequests & Beneficiaries */}
        {currentStep === 4 && (
          <div>
            <h2 className="text-xl font-bold mb-2 border-b pb-1">
              Bequests & Beneficiaries
            </h2>
            <p className="text-gray-600 text-sm mb-2">
              Enter each bequest on a separate line to create bullet points.
            </p>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block mb-1 font-bold">
                  {countryLabels[selectedCountry].specificBequests}
                </label>
                <textarea
                  className="input-field"
                  value={specificBequests}
                  onChange={(e) => setSpecificBequests(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 font-bold">
                  {countryLabels[selectedCountry].residuaryEstate}
                </label>
                <textarea
                  className="input-field"
                  value={residuaryEstate}
                  onChange={(e) => setResiduaryEstate(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 font-bold">
                  {countryLabels[selectedCountry].beneficiaries}
                </label>
                <textarea
                  className="input-field"
                  value={beneficiaries}
                  onChange={(e) => setBeneficiaries(e.target.value)}
                />
              </div>
            </div>
            <div className="buttonContainer mt-4">
              <button
                type="button"
                onClick={handlePreviousStep}
                className="previousStepButton"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="nextStepButton"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Additional Instructions & Submission */}
        {currentStep === 5 && (
          <div>
            <h2 className="text-xl font-bold mb-2 border-b pb-1">
              Additional Instructions
            </h2>
            <label className="block mb-1 font-bold mt-2">
              {countryLabels[selectedCountry].funeralInstructions}
            </label>
            <textarea
              className="input-field"
              value={funeralInstructions}
              onChange={(e) => setFuneralInstructions(e.target.value)}
            />
            <label className="block mb-1 font-bold mt-2">
              {countryLabels[selectedCountry].legalNotes}
            </label>
            <textarea
              className="input-field"
              value={legalNotes}
              onChange={(e) => setLegalNotes(e.target.value)}
            />
            {selectedCountry === "us" && (
              <div className="mt-6 border p-4 bg-gray-50">
                <label className="block font-bold mb-1">
                  {countryLabels.us.selfProvingAffidavit}
                </label>
                <input
                  type="checkbox"
                  checked={useSelfProvingAffidavit}
                  onChange={(e) => setUseSelfProvingAffidavit(e.target.checked)}
                />
                <span className="ml-2">Yes, Self-Proving Affidavit</span>
              </div>
            )}
            <div className="buttonContainer mt-4">
              <button
                type="button"
                onClick={handlePreviousStep}
                className="previousStepButton"
              >
                Previous
              </button>
              <button
                type="submit"
                disabled={loading}
                className="generateWillButton"
              >
                {loading
                  ? "Generating Testament..."
                  : "Generate Legal Testament"}
              </button>
            </div>
          </div>
        )}

        {loading && <div className="loading-bar"></div>}
      </form>

      {/* Show PDF Download Button if PDF is generated */}
      {willText && pdfBytes && !isGenerating && (
        <div className="buttonContainer mt-4">
          <button
            onClick={copyToClipboard}
            className="mr-3 px-4 py-2 border rounded bg-blue-100"
          >
            Copy Will Text
          </button>
          {copySuccess && <span className="text-green-600">{copySuccess}</span>}
          <PDFDownloadButton pdfBytes={pdfBytes} />
        </div>
      )}

      {draftSaved && (
        <div className="text-sm text-green-600 mt-2">Draft Saved</div>
      )}

      <button
        onClick={clearDraft}
        className="mt-4 px-4 py-2 border border-red-300 rounded"
      >
        Clear Draft
      </button>
    </div>
  );
}
