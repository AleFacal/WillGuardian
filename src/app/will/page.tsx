// File: WillGeneratorPage.tsx
"use client";

import "./styles.css";
import { useState, useEffect } from "react";
import { generateWill } from "@/lib/openai";
import PDFDownloadButton from "@/components/PDFDownloadButton";
import { CountryKey } from "@/components/PDFDownloadButton";

export default function WillGeneratorPage() {
  const [currentStep, setCurrentStep] = useState(1);

  // ---------------------------
  // Universal Fields
  // ---------------------------
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [nationality, setNationality] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [idNumber, setIdNumber] = useState("");

  // Executor
  const [executor, setExecutor] = useState("");
  const [alternateExecutor, setAlternateExecutor] = useState("");
  const [executorInstructions, setExecutorInstructions] = useState("");

  // Bequests
  const [specificBequests, setSpecificBequests] = useState("");
  const [residuaryEstate, setResiduaryEstate] = useState("");
  const [beneficiaries, setBeneficiaries] = useState("");

  // Additional
  const [funeralInstructions, setFuneralInstructions] = useState("");
  const [legalNotes, setLegalNotes] = useState("");

  // ---------------------------
  // US-Specific
  // ---------------------------
  const [hasMinorChildren, setHasMinorChildren] = useState(false);
  const [guardianName, setGuardianName] = useState("");
  const [backupGuardianName, setBackupGuardianName] = useState("");
  const [useSelfProvingAffidavit, setUseSelfProvingAffidavit] = useState(false);

  // ---------------------------
  // UK-Specific
  //  Example: minor children, guardians, or a "formal attestation" toggle
  // ---------------------------
  const [ukHasMinorChildren, setUkHasMinorChildren] = useState(false);
  const [ukGuardianName, setUkGuardianName] = useState("");
  const [ukBackupGuardian, setUkBackupGuardian] = useState("");
  const [ukAttestationClause, setUkAttestationClause] = useState(false);

  // ---------------------------
  // Germany-Specific
  // ---------------------------
  const [deIsHolographic, setDeIsHolographic] = useState(false);

  // ---------------------------
  // France-Specific
  // ---------------------------
  const [frIsAuthenticWill, setFrIsAuthenticWill] = useState(false);

  // ---------------------------
  // Spain-Specific
  // ---------------------------
  const [esIsNotarialWill, setEsIsNotarialWill] = useState(false);

  // ---------------------------
  // Switzerland-Specific
  // ---------------------------
  const [chIsPublicNotarial, setChIsPublicNotarial] = useState(false);

  // ---------------------------
  // Country & Language
  // ---------------------------
  const [selectedCountry, setSelectedCountry] = useState<CountryKey>("us");
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  // Steps
  const [confirmDeclaration, setConfirmDeclaration] = useState(false);
  const [willText, setWillText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // for feedback
  const [copySuccess, setCopySuccess] = useState("");

  // ---------------------------
  // Countries & Language Options
  // ---------------------------
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

  useEffect(() => {
    const lang = languageOptionsMap[selectedCountry]
      ? languageOptionsMap[selectedCountry][0]
      : "English";
    setSelectedLanguage(lang);
  }, [selectedCountry]);

  // ---------------------------
  // Localized Label (example)
  // ---------------------------
  const countryLabels = {
    us: {
      countrySelection: "Country Selection (US)",
      fullName: "Full Name (US)",
      dob: "Date of Birth (YYYY-MM-DD)",
      address: "Residential Address (US)",
      nationality: "Nationality (US)",
      executor: "Executor (trusted person)",
      alternateExecutor: "Alternate Executor (backup)",
      executorInstructions: "Instructions for the Executor (US)",
      specificBequests: "Specific Bequests (US)",
      residuaryEstate: "Residuary Estate (US)",
      beneficiaries: "Beneficiaries (US)",
      funeralInstructions: "Funeral Instructions (US)",
      legalNotes: "Legal Notes/Revocation Clause (US)",
      /** The key that TS was complaining about: */
      idNumber: "Identification Number (US)",
      /** US-specific toggles: */
      minorChildren: "Do you have minor children? (US)",
      guardianName: "Guardian Name (US)",
      backupGuardianName: "Backup Guardian (US)",
      selfProvingAffidavit: "Use Self-Proving Affidavit? (US)",
      /** We can add placeholders for the other toggles so TS is happy: */
      ukHasMinorChildren: "",
      ukGuardianName: "",
      ukBackupGuardian: "",
      ukAttestationClause: "",
      deIsHolographic: "",
      frIsAuthenticWill: "",
      esIsNotarialWill: "",
      chIsPublicNotarial: "",
    },
    uk: {
      countrySelection: "Country Selection (UK)",
      fullName: "Full Name (UK)",
      dob: "Date of Birth (DD/MM/YYYY)",
      address: "Address (UK)",
      nationality: "Nationality (UK)",
      executor: "Executor (UK)",
      alternateExecutor: "Alternate Executor (UK)",
      executorInstructions: "Executor Instructions (UK)",
      specificBequests: "Specific Bequests (UK)",
      residuaryEstate: "Residuary Estate (UK)",
      beneficiaries: "Beneficiaries (UK)",
      funeralInstructions: "Funeral Instructions (UK)",
      legalNotes: "Legal Notes (UK)",
      idNumber: "Identification Number (UK)",
      /** UK-specific toggles: */
      ukHasMinorChildren: "Do you have minor children? (UK)",
      ukGuardianName: "Guardian Name (UK)",
      ukBackupGuardian: "Backup Guardian (UK)",
      ukAttestationClause: "Need formal attestation clause? (UK)",
      /** Fill in placeholders for other countries’ toggles: */
      minorChildren: "",
      guardianName: "",
      backupGuardianName: "",
      selfProvingAffidavit: "",
      deIsHolographic: "",
      frIsAuthenticWill: "",
      esIsNotarialWill: "",
      chIsPublicNotarial: "",
    },
    de: {
      countrySelection: "Länderauswahl (DE)",
      fullName: "Vollständiger Name (DE)",
      dob: "Geburtsdatum (TT.MM.JJJJ)",
      address: "Adresse (DE)",
      nationality: "Nationalität (DE)",
      executor: "Testamentsvollstrecker (DE)",
      alternateExecutor: "Stellv. Testamentsvollstrecker (DE)",
      executorInstructions: "Anweisungen (DE)",
      specificBequests: "Spezifische Vermächtnisse (DE)",
      residuaryEstate: "Verbleibendes Erbe (DE)",
      beneficiaries: "Begünstigte (DE)",
      funeralInstructions: "Bestattungsanweisungen (DE)",
      legalNotes: "Rechtliche Hinweise (DE)",
      idNumber: "Identifikationsnummer (DE)",
      /** Germany-specific toggle: */
      deIsHolographic: "Is this a fully handwritten (holographic) will? (DE)",
      /** placeholders for other country toggles: */
      minorChildren: "",
      guardianName: "",
      backupGuardianName: "",
      selfProvingAffidavit: "",
      ukHasMinorChildren: "",
      ukGuardianName: "",
      ukBackupGuardian: "",
      ukAttestationClause: "",
      frIsAuthenticWill: "",
      esIsNotarialWill: "",
      chIsPublicNotarial: "",
    },
    fr: {
      countrySelection: "Sélection du pays",
      fullName: "Nom complet",
      dob: "Date de naissance (JJ/MM/AAAA)",
      address: "Adresse",
      nationality: "Nationalité",
      executor: "Exécuteur testamentaire",
      alternateExecutor: "Exécuteur suppléant",
      executorInstructions: "Instructions",
      specificBequests: "Légats spécifiques",
      residuaryEstate: "Reste de l'héritage",
      beneficiaries: "Bénéficiaires",
      funeralInstructions: "Instructions funéraires",
      legalNotes: "Notes légales",
      idNumber: "Identifiant",
      /** France-specific toggle: */
      frIsAuthenticWill: "S'agit-il d'un testament authentique (notarié)?",
      /** placeholders for others: */
      minorChildren: "",
      guardianName: "",
      backupGuardianName: "",
      selfProvingAffidavit: "",
      ukHasMinorChildren: "",
      ukGuardianName: "",
      ukBackupGuardian: "",
      ukAttestationClause: "",
      deIsHolographic: "",
      esIsNotarialWill: "",
      chIsPublicNotarial: "",
    },
    es: {
      countrySelection: "Selección de país",
      fullName: "Nombre completo",
      dob: "Fecha de nacimiento (DD/MM/AAAA)",
      address: "Dirección",
      nationality: "Nacionalidad",
      executor: "Ejecutor del testamento",
      alternateExecutor: "Ejecutor alternativo",
      executorInstructions: "Instrucciones",
      specificBequests: "Legados específicos",
      residuaryEstate: "Resto de la herencia",
      beneficiaries: "Beneficiarios",
      funeralInstructions: "Instrucciones funerarias",
      legalNotes: "Notas legales",
      idNumber: "Número de identificación",
      /** Spain-specific toggle: */
      esIsNotarialWill: "Es esto un testamento notarial?",
      /** placeholders for others: */
      minorChildren: "",
      guardianName: "",
      backupGuardianName: "",
      selfProvingAffidavit: "",
      ukHasMinorChildren: "",
      ukGuardianName: "",
      ukBackupGuardian: "",
      ukAttestationClause: "",
      deIsHolographic: "",
      frIsAuthenticWill: "",
      chIsPublicNotarial: "",
    },
    ch: {
      countrySelection: "Länderauswahl (CH)",
      fullName: "Vollständiger Name (CH)",
      dob: "Geburtsdatum (TT.MM.JJJJ)",
      address: "Wohnadresse (CH)",
      nationality: "Nationalität (CH)",
      executor: "Testamentsvollstrecker (CH)",
      alternateExecutor: "Stellv. Testamentsvollstrecker (CH)",
      executorInstructions: "Anweisungen (CH)",
      specificBequests: "Spezifische Vermächtnisse (CH)",
      residuaryEstate: "Restvermögen (CH)",
      beneficiaries: "Begünstigte (CH)",
      funeralInstructions: "Bestattungsanweisungen (CH)",
      legalNotes: "Rechtliche Hinweise (CH)",
      idNumber: "ID Nummer (CH)",
      /** Switzerland-specific toggle: */
      chIsPublicNotarial:
        "Is this a public notarial will? (CH) (requires notary + 2 witnesses)",
      /** placeholders for others: */
      minorChildren: "",
      guardianName: "",
      backupGuardianName: "",
      selfProvingAffidavit: "",
      ukHasMinorChildren: "",
      ukGuardianName: "",
      ukBackupGuardian: "",
      ukAttestationClause: "",
      deIsHolographic: "",
      frIsAuthenticWill: "",
      esIsNotarialWill: "",
    },
  };

  // ---------------------------
  // Step Navigation
  // ---------------------------
  const handleNextStep = () => setCurrentStep(currentStep + 1);
  const handlePreviousStep = () => setCurrentStep(currentStep - 1);

  // ---------------------------
  // Load & Save Draft
  // ---------------------------
  useEffect(() => {
    const savedDraft = localStorage.getItem("willDraft");
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      // Load universal:
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

      // US
      setHasMinorChildren(draft.hasMinorChildren || false);
      setGuardianName(draft.guardianName || "");
      setBackupGuardianName(draft.backupGuardianName || "");
      setUseSelfProvingAffidavit(draft.useSelfProvingAffidavit || false);

      // UK
      setUkHasMinorChildren(draft.ukHasMinorChildren || false);
      setUkGuardianName(draft.ukGuardianName || "");
      setUkBackupGuardian(draft.ukBackupGuardian || "");
      setUkAttestationClause(draft.ukAttestationClause || false);

      // DE
      setDeIsHolographic(draft.deIsHolographic || false);

      // FR
      setFrIsAuthenticWill(draft.frIsAuthenticWill || false);

      // ES
      setEsIsNotarialWill(draft.esIsNotarialWill || false);

      // CH
      setChIsPublicNotarial(draft.chIsPublicNotarial || false);
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

      // US
      hasMinorChildren,
      guardianName,
      backupGuardianName,
      useSelfProvingAffidavit,

      // UK
      ukHasMinorChildren,
      ukGuardianName,
      ukBackupGuardian,
      ukAttestationClause,

      // DE
      deIsHolographic,

      // FR
      frIsAuthenticWill,

      // ES
      esIsNotarialWill,

      // CH
      chIsPublicNotarial,
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
    confirmDeclaration,
    hasMinorChildren,
    guardianName,
    backupGuardianName,
    useSelfProvingAffidavit,
    ukHasMinorChildren,
    ukGuardianName,
    ukBackupGuardian,
    ukAttestationClause,
    deIsHolographic,
    frIsAuthenticWill,
    esIsNotarialWill,
    chIsPublicNotarial,
  ]);

  const clearDraft = () => {
    localStorage.removeItem("willDraft");
    // Reset universal:
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

    // Reset US
    setHasMinorChildren(false);
    setGuardianName("");
    setBackupGuardianName("");
    setUseSelfProvingAffidavit(false);

    // Reset UK
    setUkHasMinorChildren(false);
    setUkGuardianName("");
    setUkBackupGuardian("");
    setUkAttestationClause(false);

    // DE
    setDeIsHolographic(false);

    // FR
    setFrIsAuthenticWill(false);

    // ES
    setEsIsNotarialWill(false);

    // CH
    setChIsPublicNotarial(false);
  };

  // ---------------------------
  // Submit => Build the prompt
  // ---------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setLoading(true);

    try {
      let prompt = `Generate a legally valid and professional Last Will and Testament in ${selectedLanguage} for the following details:\n\n`;

      // Basic info
      prompt += `Full Name: ${fullName}\nDate of Birth: ${dob}\nAddress: ${address}\nNationality: ${nationality}\nMarital Status: ${maritalStatus}\nID Number: ${idNumber}\n\n`;
      // Executor
      prompt += `Executor: ${executor}\nAlternate Executor: ${alternateExecutor}\nExecutor Instructions: ${executorInstructions}\n\n`;
      // Bequests
      prompt += `Bequests & Beneficiaries:\nSpecific Bequests: ${specificBequests}\nResiduary Estate: ${residuaryEstate}\nBeneficiaries: ${beneficiaries}\n\n`;
      // Additional
      prompt += `Funeral Instructions: ${funeralInstructions}\nLegal Notes: ${legalNotes}\n\n`;

      // US
      if (selectedCountry === "us") {
        if (hasMinorChildren) {
          prompt += `Guardian Clause => Primary: ${guardianName}, Backup: ${backupGuardianName}\n\n`;
        }
        if (useSelfProvingAffidavit) {
          prompt += `Self-Proving Affidavit requested (common in many US states)\n`;
        }
      }

      // UK
      if (selectedCountry === "uk") {
        if (ukHasMinorChildren) {
          prompt += `UK Guardianship => Guardian: ${ukGuardianName}, Backup: ${ukBackupGuardian}\n`;
        }
        if (ukAttestationClause) {
          prompt += `Formal Attestation Clause needed.\n`;
        }
      }

      // Germany
      if (selectedCountry === "de" && deIsHolographic) {
        prompt += `This is a fully handwritten (holographic) will in Germany. No witnesses needed.\n`;
      }

      // France
      if (selectedCountry === "fr" && frIsAuthenticWill) {
        prompt += `This is an Authentic (notarial) will in France => Notary + 2 witnesses.\n`;
      }

      // Spain
      if (selectedCountry === "es" && esIsNotarialWill) {
        prompt += `This is a notarial will in Spain => Notary involvement.\n`;
      }

      // Switzerland
      if (selectedCountry === "ch" && chIsPublicNotarial) {
        prompt += `This is a public notarial will in Switzerland => Notary + 2 witnesses.\n`;
      }

      prompt += `Country: ${selectedCountry}\nLanguage: ${selectedLanguage}\n`;

      // Actually call your openAI logic
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
        "", // witnesses (if needed)
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

  // Example copy to clipboard
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

  // ---------------------------
  // Steps for UI
  // ---------------------------
  return (
    <div className="form-box">
      <h1>Legal Last Will & Testament Generator</h1>

      <form onSubmit={handleSubmit} className="form-section">
        {currentStep === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-2 border-b pb-1">
              {countryLabels[selectedCountry].countrySelection}
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <label className="block mb-1 font-medium">
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

        {currentStep === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-2 border-b pb-1">
              Personal Information
            </h2>
            {/* Full name, DOB, etc. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">
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
                <label className="block mb-1 font-medium">
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
                <label className="block mb-1 font-medium">
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
                <label className="block mb-1 font-medium">
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
                <label className="block mb-1 font-medium">Marital Status</label>
                <input
                  type="text"
                  className="input-field"
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  {countryLabels[selectedCountry]?.idNumber || "ID Number"}
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                />
              </div>
            </div>

            {/* US Minor Children */}
            {selectedCountry === "us" && (
              <div className="mt-6 border p-4 bg-gray-50">
                <label className="block font-medium mb-1">
                  {countryLabels.us.minorChildren}
                </label>
                <input
                  type="checkbox"
                  checked={hasMinorChildren}
                  onChange={(e) => setHasMinorChildren(e.target.checked)}
                />
                <span className="ml-2">Yes, minor children</span>

                {hasMinorChildren && (
                  <div className="mt-4">
                    <label className="block mb-1 font-medium">
                      {countryLabels.us.guardianName}
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                    />
                    <label className="block mb-1 font-medium mt-2">
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

            {/* UK Minor Children + Attestation Clause */}
            {selectedCountry === "uk" && (
              <div className="mt-6 border p-4 bg-gray-50">
                <label className="block font-medium mb-1">
                  {countryLabels.uk.ukHasMinorChildren}
                </label>
                <input
                  type="checkbox"
                  checked={ukHasMinorChildren}
                  onChange={(e) => setUkHasMinorChildren(e.target.checked)}
                />
                <span className="ml-2">Yes, minor children (UK)</span>

                {ukHasMinorChildren && (
                  <div className="mt-4">
                    <label className="block mb-1 font-medium">
                      {countryLabels.uk.ukGuardianName}
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={ukGuardianName}
                      onChange={(e) => setUkGuardianName(e.target.value)}
                    />
                    <label className="block mb-1 font-medium mt-2">
                      {countryLabels.uk.ukBackupGuardian}
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={ukBackupGuardian}
                      onChange={(e) => setUkBackupGuardian(e.target.value)}
                    />
                  </div>
                )}
                <div className="mt-4">
                  <label className="block mb-1 font-medium">
                    {countryLabels.uk.ukAttestationClause}
                  </label>
                  <input
                    type="checkbox"
                    checked={ukAttestationClause}
                    onChange={(e) => setUkAttestationClause(e.target.checked)}
                  />
                  <span className="ml-2">
                    Need a formal attestation clause (UK)
                  </span>
                </div>
              </div>
            )}

            {/* Germany Holographic Toggle */}
            {selectedCountry === "de" && (
              <div className="mt-6 border p-4 bg-gray-50">
                <label className="block mb-1 font-medium">
                  {countryLabels.de.deIsHolographic}
                </label>
                <input
                  type="checkbox"
                  checked={deIsHolographic}
                  onChange={(e) => setDeIsHolographic(e.target.checked)}
                />
                <span className="ml-2">Yes, fully handwritten (DE)</span>
              </div>
            )}

            {/* Switzerland Public Notarial Toggle */}
            {selectedCountry === "ch" && (
              <div className="mt-6 border p-4 bg-gray-50">
                <label className="block mb-1 font-medium">
                  {countryLabels.ch.chIsPublicNotarial}
                </label>
                <input
                  type="checkbox"
                  checked={chIsPublicNotarial}
                  onChange={(e) => setChIsPublicNotarial(e.target.checked)}
                />
                <span className="ml-2">Yes, public notarial will (CH)</span>
              </div>
            )}

            {/* France Authentic Toggle */}
            {selectedCountry === "fr" && (
              <div className="mt-6 border p-4 bg-gray-50">
                <label className="block mb-1 font-medium">
                  {countryLabels.fr.frIsAuthenticWill}
                </label>
                <input
                  type="checkbox"
                  checked={frIsAuthenticWill}
                  onChange={(e) => setFrIsAuthenticWill(e.target.checked)}
                />
                <span className="ml-2">
                  Yes, authentic (notarial) will (FR)
                </span>
              </div>
            )}

            {/* Spain Notarial Toggle */}
            {selectedCountry === "es" && (
              <div className="mt-6 border p-4 bg-gray-50">
                <label className="block mb-1 font-medium">
                  {countryLabels.es.esIsNotarialWill}
                </label>
                <input
                  type="checkbox"
                  checked={esIsNotarialWill}
                  onChange={(e) => setEsIsNotarialWill(e.target.checked)}
                />
                <span className="ml-2">Yes, notarial will (ES)</span>
              </div>
            )}

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

        {currentStep === 3 && (
          <div>
            <h2 className="text-xl font-semibold mb-2 border-b pb-1">
              Executor Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">
                  {countryLabels[selectedCountry].executor || "Executor"}
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={executor}
                  onChange={(e) => setExecutor(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  {countryLabels[selectedCountry].alternateExecutor ||
                    "Alternate Executor"}
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={alternateExecutor}
                  onChange={(e) => setAlternateExecutor(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block mb-1 font-medium">
                  {countryLabels[selectedCountry].executorInstructions}
                </label>
                <textarea
                  className="input-field"
                  value={executorInstructions}
                  onChange={(e) => setExecutorInstructions(e.target.value)}
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
                  className="input-field"
                  value={specificBequests}
                  onChange={(e) => setSpecificBequests(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  {countryLabels[selectedCountry].residuaryEstate}
                </label>
                <textarea
                  className="input-field"
                  value={residuaryEstate}
                  onChange={(e) => setResiduaryEstate(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
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

        {currentStep === 5 && (
          <div>
            <h2 className="text-xl font-semibold mb-2 border-b pb-1">
              Additional Instructions
            </h2>
            <label className="block mb-1 font-medium mt-2">
              {countryLabels[selectedCountry].funeralInstructions}
            </label>
            <textarea
              className="input-field"
              value={funeralInstructions}
              onChange={(e) => setFuneralInstructions(e.target.value)}
            />
            <label className="block mb-1 font-medium mt-2">
              {countryLabels[selectedCountry].legalNotes}
            </label>
            <textarea
              className="input-field"
              value={legalNotes}
              onChange={(e) => setLegalNotes(e.target.value)}
            />

            {/* US self-proving affidavit */}
            {selectedCountry === "us" && (
              <div className="mt-6 border p-4 bg-gray-50">
                <label className="block font-medium mb-1">
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

        {willText && !isGenerating && (
          <div className="buttonContainer mt-4">
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
