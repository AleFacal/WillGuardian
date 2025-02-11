// File: WillGeneratorPage.tsx
"use client";

import "./styles.css";
import { useState, useEffect } from "react";
import { generateWill } from "@/lib/openai";
import PDFDownloadButton from "@/components/PDFDownloadButton";
import { CountryKey } from "@/components/PDFDownloadButton";

export default function WillGeneratorPage() {
  const [currentStep, setCurrentStep] = useState(1);

  // Personal Information
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [nationality, setNationality] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [idNumber, setIdNumber] = useState("");

  // Executor Information
  const [executor, setExecutor] = useState("");
  const [alternateExecutor, setAlternateExecutor] = useState("");
  const [executorInstructions, setExecutorInstructions] = useState("");

  // Bequests & Beneficiaries
  const [specificBequests, setSpecificBequests] = useState("");
  const [residuaryEstate, setResiduaryEstate] = useState("");
  const [beneficiaries, setBeneficiaries] = useState("");

  // Additional Instructions
  const [funeralInstructions, setFuneralInstructions] = useState("");
  const [legalNotes, setLegalNotes] = useState("");

  // Jurisdiction & Language
  const [selectedCountry, setSelectedCountry] = useState<CountryKey>("us");
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  // Declaration Confirmation
  const [confirmDeclaration, setConfirmDeclaration] = useState(false);

  // Generated Will & Loading State
  const [willText, setWillText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Extra state for saved draft and copy feedback
  const [draftSaved, setDraftSaved] = useState(false);
  const [copySuccess, setCopySuccess] = useState("");

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

  useEffect(() => {
    const language = languageOptionsMap[selectedCountry]
      ? languageOptionsMap[selectedCountry][0]
      : "English";
    setSelectedLanguage(language);
  }, [selectedCountry]);

  const countryLabels = {
    us: {
      countrySelection: "Country Selection",
      fullName: "Full Name (as per legal documents)",
      dob: "Date of Birth (YYYY-MM-DD)",
      address: "Residential Address",
      nationality: "Nationality",
      executor: "Executor (Name of trusted person)",
      alternateExecutor: "Alternate Executor (Name of backup)",
      executorInstructions: "Instructions for the Executor",
      specificBequests: "Specific Bequests (List and description)",
      residuaryEstate: "Residuary Estate Instructions",
      beneficiaries: "Beneficiaries (Names and details)",
      funeralInstructions: "Funeral Instructions (Details)",
      legalNotes: "Legal Notes/Revocation Clause",
    },
    uk: {
      // Similar labels in English or local language.
      countrySelection: "Country Selection",
      fullName: "Full Name (as per legal documents)",
      dob: "Date of Birth (YYYY-MM-DD)",
      address: "Residential Address",
      nationality: "Nationality",
      executor: "Executor (Name of trusted person)",
      alternateExecutor: "Alternate Executor (Name of backup)",
      executorInstructions: "Instructions for the Executor",
      specificBequests: "Specific Bequests",
      residuaryEstate: "Residuary Estate Instructions",
      beneficiaries: "Beneficiaries",
      funeralInstructions: "Funeral Instructions",
      legalNotes: "Legal Notes/Revocation Clause",
    },
    de: {
      countrySelection: "Länderauswahl",
      fullName: "Vollständiger Name (wie im Ausweis)",
      dob: "Geburtsdatum (TT.MM.JJJJ)",
      address: "Wohnadresse",
      nationality: "Nationalität",
      executor: "Testamentsvollstrecker",
      alternateExecutor: "Stellvertretender Testamentsvollstrecker",
      executorInstructions: "Anweisungen an den Testamentsvollstrecker",
      specificBequests: "Spezifische Vermächtnisse",
      residuaryEstate: "Anweisungen für das verbleibende Erbe",
      beneficiaries: "Begünstigte",
      funeralInstructions: "Bestattungsanweisungen",
      legalNotes: "Rechtliche Hinweise",
    },
    fr: {
      countrySelection: "Sélection du pays",
      fullName: "Nom complet (tel qu’indiqué sur vos documents)",
      dob: "Date de naissance (AAAA-MM-JJ)",
      address: "Adresse",
      nationality: "Nationalité",
      executor: "Exécuteur testamentaire",
      alternateExecutor: "Exécuteur suppléant",
      executorInstructions: "Instructions pour l'exécuteur",
      specificBequests: "Légataires spécifiques",
      residuaryEstate: "Instructions concernant le reste de l'héritage",
      beneficiaries: "Bénéficiaires",
      funeralInstructions: "Instructions funéraires",
      legalNotes: "Notes légales",
    },
    es: {
      countrySelection: "Selección de país",
      fullName: "Nombre completo (según documentos legales)",
      dob: "Fecha de nacimiento (AAAA-MM-DD)",
      address: "Dirección",
      nationality: "Nacionalidad",
      executor: "Ejecutor del testamento",
      alternateExecutor: "Ejecutor alternativo",
      executorInstructions: "Instrucciones para el ejecutor",
      specificBequests: "Legados específicos",
      residuaryEstate: "Instrucciones para el resto de la herencia",
      beneficiaries: "Beneficiarios",
      funeralInstructions: "Instrucciones funerarias",
      legalNotes: "Notas legales",
    },
    ch: {
      // For Switzerland (in German)
      countrySelection: "Länderauswahl",
      fullName: "Vollständiger Name (laut Ausweis)",
      dob: "Geburtsdatum (TT.MM.JJJJ)",
      address: "Wohnadresse",
      nationality: "Nationalität",
      executor: "Testamentsvollstrecker",
      alternateExecutor: "Stellvertretender Testamentsvollstrecker",
      executorInstructions: "Anweisungen an den Testamentsvollstrecker",
      specificBequests: "Spezifische Vermächtnisse",
      residuaryEstate: "Anweisungen für das verbleibende Erbe",
      beneficiaries: "Begünstigte",
      funeralInstructions: "Bestattungsanweisungen",
      legalNotes: "Rechtliche Hinweise",
    },
  };

  const languageOptions = languageOptionsMap[selectedCountry] || ["English"];

  // (Optional) For countries that require witnesses, you can add witness input fields.
  const countriesRequiringWitnesses = ["uk", "de", "ch"];

  const handleNextStep = () => setCurrentStep(currentStep + 1);
  const handlePreviousStep = () => setCurrentStep(currentStep - 1);

  // Load saved draft (if any)
  useEffect(() => {
    const savedDraft = localStorage.getItem("willDraft");
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      setFullName(draft.fullName || "");
      setDob(draft.dob || "");
      setAddress(draft.address || "");
      setNationality(draft.nationality || "");
      setMaritalStatus(draft.maritalStatus || "");
      setIdNumber(draft.idNumber || "");
      setExecutor(draft.executor || "");
      setAlternateExecutor(draft.alternateExecutor || "");
      setExecutorInstructions(draft.executorInstructions || "");
      setSpecificBequests(draft.specificBequests || "");
      setResiduaryEstate(draft.residuaryEstate || "");
      setBeneficiaries(draft.beneficiaries || "");
      setFuneralInstructions(draft.funeralInstructions || "");
      setLegalNotes(draft.legalNotes || "");
      setSelectedCountry(draft.selectedCountry || "us");
      setSelectedLanguage(draft.selectedLanguage || "English");
      setConfirmDeclaration(draft.confirmDeclaration || false);
    }
  }, []);

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
      confirmDeclaration,
    };
    localStorage.setItem("willDraft", JSON.stringify(draft));
    setDraftSaved(true);
    const timeout = setTimeout(() => setDraftSaved(false), 2000);
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
    confirmDeclaration,
  ]);

  const clearDraft = () => {
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
    setConfirmDeclaration(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setLoading(true);

    try {
      let prompt = `Generate a legally valid and professional Last Will and Testament in ${selectedLanguage} for the following details.\n\n`;
      prompt += `Full Name: ${fullName}\nDate of Birth: ${dob}\nAddress: ${address}\nNationality: ${nationality}\nMarital Status: ${maritalStatus}\nIdentification Number: ${idNumber}\n\n`;
      prompt += `Executor Information:\n  Executor: ${executor}\n  Alternate Executor: ${alternateExecutor}\n  Executor Instructions: ${executorInstructions}\n\n`;
      prompt += `Bequests & Beneficiaries:\n  Specific Bequests: ${specificBequests}\n  Residuary Estate: ${residuaryEstate}\n  Beneficiaries: ${beneficiaries}\n\n`;
      prompt += `Additional Instructions:\n  Funeral Instructions: ${funeralInstructions}\n  Legal Notes/Revocation Clause: ${legalNotes}\n\n`;
      prompt += `Country: ${selectedCountry}\nTestament Language: ${selectedLanguage}\n`;

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
        "", // Witnesses (if applicable)
        `${funeralInstructions}\n${legalNotes}`,
        selectedCountry,
        selectedLanguage
      );
      setWillText(text);
    } catch (error) {
      console.error("Error generating will:", error);
    }
    setIsGenerating(false);
    setLoading(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(willText);
      setCopySuccess("Will text copied to clipboard!");
      setTimeout(() => setCopySuccess(""), 2000);
    } catch (err) {
      setCopySuccess("Failed to copy.");
    }
  };

  return (
    <div className="form-box">
      <h1>Legal Last Will & Testament Generator</h1>

      <form onSubmit={handleSubmit} className="form-section">
        {/* Step 1: Country Selection */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-2 border-b pb-1">
              {countryLabels[selectedCountry].countrySelection}
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <label className="block mb-1 font-medium">
                {countryLabels[selectedCountry].countrySelection} *
              </label>
              <select
                value={selectedCountry}
                onChange={(e) =>
                  setSelectedCountry(e.target.value as CountryKey)
                }
                required
                className="input-field"
              >
                {countryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="buttonContainer single-button">
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

        {/* Step 2: Personal Information */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-2 border-b pb-1">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">
                  {countryLabels[selectedCountry].fullName} *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="e.g., John Doe (as per your passport)"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  {countryLabels[selectedCountry].dob} *
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                  className="input-field"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block mb-1 font-medium">
                  {countryLabels[selectedCountry].address} *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  placeholder="e.g., 123 Main Street, City, Country"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  {countryLabels[selectedCountry].nationality}
                </label>
                <input
                  type="text"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="e.g., American"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Marital Status</label>
                <input
                  type="text"
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  placeholder="e.g., Single, Married"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  Identification Number
                </label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="e.g., Passport or National ID number"
                  className="input-field"
                />
              </div>
            </div>
            <div className="buttonContainer single-button">
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

        {/* Step 3: Executor Information */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-xl font-semibold mb-2 border-b pb-1">
              Executor Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">
                  {countryLabels[selectedCountry].executor} *
                </label>
                <input
                  type="text"
                  value={executor}
                  onChange={(e) => setExecutor(e.target.value)}
                  required
                  placeholder="e.g., Jane Smith"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  {countryLabels[selectedCountry].alternateExecutor}
                </label>
                <input
                  type="text"
                  value={alternateExecutor}
                  onChange={(e) => setAlternateExecutor(e.target.value)}
                  placeholder="e.g., Robert Brown"
                  className="input-field"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block mb-1 font-medium">
                  {countryLabels[selectedCountry].executorInstructions}
                </label>
                <textarea
                  value={executorInstructions}
                  onChange={(e) => setExecutorInstructions(e.target.value)}
                  placeholder="Provide detailed instructions for the executor..."
                  className="input-field"
                />
              </div>
            </div>
            <div className="buttonContainer">
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

        {/* Step 4: Bequests & Beneficiaries */}
        {currentStep === 4 && (
          <div>
            <h2 className="text-xl font-semibold mb-2 border-b pb-1">
              Bequests & Beneficiaries
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block mb-1 font-medium">
                  {countryLabels[selectedCountry].specificBequests}
                </label>
                <textarea
                  value={specificBequests}
                  onChange={(e) => setSpecificBequests(e.target.value)}
                  placeholder="Detail specific items or amounts bequeathed..."
                  className="input-field"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  {countryLabels[selectedCountry].residuaryEstate}
                </label>
                <textarea
                  value={residuaryEstate}
                  onChange={(e) => setResiduaryEstate(e.target.value)}
                  placeholder="Instructions for the remaining estate..."
                  className="input-field"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  {countryLabels[selectedCountry].beneficiaries}
                </label>
                <textarea
                  value={beneficiaries}
                  onChange={(e) => setBeneficiaries(e.target.value)}
                  placeholder="List all beneficiaries and their relationships..."
                  className="input-field"
                />
              </div>
            </div>
            <div className="buttonContainer">
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

        {/* Final Step: Additional Instructions */}
        {currentStep === 5 && (
          <div>
            <h2 className="text-xl font-semibold mb-2 border-b pb-1">
              Additional Instructions
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <label className="block mb-1 font-medium">
                {countryLabels[selectedCountry].funeralInstructions}
              </label>
              <textarea
                value={funeralInstructions}
                onChange={(e) => setFuneralInstructions(e.target.value)}
                placeholder="e.g., Provide detailed funeral and burial instructions..."
                className="input-field"
              />
              <label className="block mb-1 font-medium">
                {countryLabels[selectedCountry].legalNotes}
              </label>
              <textarea
                value={legalNotes}
                onChange={(e) => setLegalNotes(e.target.value)}
                placeholder="e.g., Revocation clause, legal disclaimers..."
                className="input-field"
              />
            </div>
            <div className="buttonContainer">
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

        {/* Loading Spinner */}
        {loading && <div className="loading-bar"></div>}

        {/* Generated Will PDF Download Button */}
        {willText && !isGenerating && (
          <div className="buttonContainer">
            <PDFDownloadButton
              willText={willText}
              selectedCountry={selectedCountry}
              selectedLanguage={selectedLanguage}
            />
          </div>
        )}
      </form>
    </div>
  );
}
