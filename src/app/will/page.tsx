"use client";

import "./styles.css";
import { useState, useEffect } from "react";
import { generateWill } from "@/lib/openai";
import PDFDownloadButton from "@/components/PDFDownloadButton";
import { generatePDF, CountryKey } from "@/components/PDFGenerator";

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

  // Universal fields
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [nationality, setNationality] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [idNumber, setIdNumber] = useState("");

  // Executor info
  const [executor, setExecutor] = useState("");
  const [alternateExecutor, setAlternateExecutor] = useState("");
  const [executorInstructions, setExecutorInstructions] = useState("");

  // Bequests & beneficiaries
  const [specificBequests, setSpecificBequests] = useState("");
  const [residuaryEstate, setResiduaryEstate] = useState("");
  const [beneficiaries, setBeneficiaries] = useState("");

  // Additional instructions
  const [funeralInstructions, setFuneralInstructions] = useState("");
  const [legalNotes, setLegalNotes] = useState("");

  // US-specific
  const [hasMinorChildren, setHasMinorChildren] = useState(false);
  const [guardianName, setGuardianName] = useState("");
  const [backupGuardianName, setBackupGuardianName] = useState("");
  const [useSelfProvingAffidavit, setUseSelfProvingAffidavit] = useState(false);
  const [usState, setUsState] = useState("");

  // UK-specific
  const [ukHasMinorChildren, setUkHasMinorChildren] = useState(false);
  const [ukGuardianName, setUkGuardianName] = useState("");
  const [ukBackupGuardian, setUkBackupGuardian] = useState("");
  const [ukAttestationClause, setUkAttestationClause] = useState(false);

  // Germany-specific
  const [deIsHolographic, setDeIsHolographic] = useState(false);

  // France-specific
  const [frIsAuthenticWill, setFrIsAuthenticWill] = useState(false);
  const [frIsHolographic, setFrIsHolographic] = useState(false);

  // Spain-specific
  const [esIsNotarialWill, setEsIsNotarialWill] = useState(false);
  const [esIsHolographic, setEsIsHolographic] = useState(false);

  // Switzerland-specific
  const [chIsPublicNotarial, setChIsPublicNotarial] = useState(false);
  const [chIsHolographic, setChIsHolographic] = useState(false);

  // Country & Language
  const [selectedCountry, setSelectedCountry] = useState<CountryKey>("us");
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  // Generated output state
  const [willText, setWillText] = useState("");
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);

  // UI flags
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
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
  const languageOptions = languageOptionsMap[selectedCountry] || ["English"];

  useEffect(() => {
    const lang = languageOptionsMap[selectedCountry]
      ? languageOptionsMap[selectedCountry][0]
      : "English";
    setSelectedLanguage(lang);
  }, [selectedCountry]);

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
      beneficiaries: "Beneficiarios",
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

  const handleNextStep = () => setCurrentStep(currentStep + 1);
  const handlePreviousStep = () => setCurrentStep(currentStep - 1);

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
      setHasMinorChildren(draft.hasMinorChildren || false);
      setGuardianName(draft.guardianName || "");
      setBackupGuardianName(draft.backupGuardianName || "");
      setUseSelfProvingAffidavit(draft.useSelfProvingAffidavit || false);
      setUsState(draft.usState || "");
      setUkHasMinorChildren(draft.ukHasMinorChildren || false);
      setUkGuardianName(draft.ukGuardianName || "");
      setUkBackupGuardian(draft.ukBackupGuardian || "");
      setUkAttestationClause(draft.ukAttestationClause || false);
      setDeIsHolographic(draft.deIsHolographic || false);
      setFrIsAuthenticWill(draft.frIsAuthenticWill || false);
      setFrIsHolographic(draft.frIsHolographic || false);
      setEsIsNotarialWill(draft.esIsNotarialWill || false);
      setEsIsHolographic(draft.esIsHolographic || false);
      setChIsPublicNotarial(draft.chIsPublicNotarial || false);
      setChIsHolographic(draft.chIsHolographic || false);
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setLoading(true);
    try {
      let prompt = `Generate a legally valid and professional Last Will and Testament in ${selectedLanguage} for the following details:\n\n`;
      prompt += `Full Name: ${fullName}\nDate of Birth: ${dob}\nAddress: ${address}\nNationality: ${nationality}\n`;
      // Only include marital status if provided.
      if (maritalStatus && maritalStatus.toLowerCase() !== "undefined") {
        prompt += `Marital Status: ${maritalStatus}\n`;
      }
      prompt += `Identification Number: ${
        idNumber ? idNumber : "[ID_BLANK]"
      }\n\n`;
      prompt += `Executor: ${executor}\nAlternate Executor: ${alternateExecutor}\nExecutor Instructions: ${executorInstructions}\n\n`;
      prompt += `Bequests & Beneficiaries:\nSpecific Bequests: ${specificBequests}\nResiduary Estate: ${residuaryEstate}\nBeneficiaries: ${beneficiaries}\n\n`;
      prompt += `Funeral Instructions: ${funeralInstructions}\nLegal Notes: ${legalNotes}\n\n`;
      if (selectedCountry === "us") {
        if (hasMinorChildren) {
          prompt += `Guardian Clause => Primary: ${guardianName}, Backup: ${backupGuardianName}\n\n`;
        }
        if (useSelfProvingAffidavit) {
          prompt += `Self-Proving Affidavit requested.\n`;
        }
        if (usState) {
          prompt += `State: ${usState}\n`;
        }
      }
      if (selectedCountry === "uk") {
        if (ukHasMinorChildren) {
          prompt += `UK Guardianship => Guardian: ${ukGuardianName}, Backup: ${ukBackupGuardian}\n`;
        }
        if (ukAttestationClause) {
          prompt += `Formal Attestation Clause needed (to be signed in the presence of exactly two witnesses simultaneously).\n`;
        }
      }
      if (selectedCountry === "de" && deIsHolographic) {
        prompt += `This is a fully handwritten (holographic) will in Germany. No witnesses needed.\n`;
      }
      if (selectedCountry === "fr") {
        if (frIsHolographic) {
          prompt += `This is a fully handwritten (holographic) will in France. No witnesses are required, but it must be entirely handwritten and signed.\n`;
        } else if (frIsAuthenticWill) {
          prompt += `This is an authentic (notarial) will in France. A notary and two witnesses are typically involved.\n`;
        }
      }
      if (selectedCountry === "es") {
        if (esIsHolographic) {
          prompt += `This is a fully handwritten (holographic) will in Spain. No witnesses are required, but it must be entirely handwritten and signed.\n`;
        } else if (esIsNotarialWill) {
          prompt += `This is a notarial will in Spain. Notary involvement is required.\n`;
        }
      }
      if (selectedCountry === "ch") {
        if (chIsHolographic) {
          prompt += `This is a fully handwritten (holographic) will in Switzerland. No notary or witnesses are required.\n`;
        } else if (chIsPublicNotarial) {
          prompt += `This is a public notarial will in Switzerland. A notary and two witnesses are required.\n`;
        }
      }
      // (Removed the lines that output Country and Language)

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

      // Generate the PDF once on submission
      const pdf = await generatePDF(
        text,
        selectedLanguage,
        selectedCountry,
        false
      );
      setPdfBytes(pdf);
    } catch (error) {
      console.error("Error generating will:", error);
    }
    setIsGenerating(false);
    setLoading(false);
  };

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

        {currentStep === 3 && (
          <div>
            <h2 className="text-xl font-bold mb-2 border-b pb-1">
              Executor Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-bold">
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
                <label className="block mb-1 font-bold">
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
            <h2 className="text-xl font-bold mb-2 border-b pb-1">
              Bequests & Beneficiaries
            </h2>
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

            {selectedCountry === "ch" && (
              <div className="mt-6 border p-4 bg-gray-50">
                <label className="block font-bold mb-1">
                  Choose the will format for Switzerland:
                </label>
                <div>
                  <input
                    type="radio"
                    name="chWillFormat"
                    value="public"
                    checked={chIsPublicNotarial}
                    onChange={() => {
                      setChIsPublicNotarial(true);
                      setChIsHolographic(false);
                    }}
                  />
                  <span className="ml-2">
                    {countryLabels.ch.chIsPublicNotarial}
                  </span>
                </div>
                <div className="mt-2">
                  <input
                    type="radio"
                    name="chWillFormat"
                    value="holographic"
                    checked={chIsHolographic}
                    onChange={() => {
                      setChIsHolographic(true);
                      setChIsPublicNotarial(false);
                    }}
                  />
                  <span className="ml-2">
                    {countryLabels.ch.chIsHolographic}
                  </span>
                </div>
              </div>
            )}

            {selectedCountry === "fr" && (
              <div className="mt-6 border p-4 bg-gray-50">
                <label className="block font-bold mb-1">
                  Choose the will format for France:
                </label>
                <div>
                  <input
                    type="radio"
                    name="frWillFormat"
                    value="authentic"
                    checked={frIsAuthenticWill && !frIsHolographic}
                    onChange={() => {
                      setFrIsAuthenticWill(true);
                      setFrIsHolographic(false);
                    }}
                  />
                  <span className="ml-2">
                    {countryLabels.fr.frIsAuthenticWill}
                  </span>
                </div>
                <div className="mt-2">
                  <input
                    type="radio"
                    name="frWillFormat"
                    value="holographic"
                    checked={frIsHolographic}
                    onChange={() => {
                      setFrIsHolographic(true);
                      setFrIsAuthenticWill(false);
                    }}
                  />
                  <span className="ml-2">
                    {countryLabels.fr.frIsHolographic}
                  </span>
                </div>
              </div>
            )}

            {selectedCountry === "es" && (
              <div className="mt-6 border p-4 bg-gray-50">
                <label className="block font-bold mb-1">
                  Choose the will format for Spain:
                </label>
                <div>
                  <input
                    type="radio"
                    name="esWillFormat"
                    value="notarial"
                    checked={esIsNotarialWill && !esIsHolographic}
                    onChange={() => {
                      setEsIsNotarialWill(true);
                      setEsIsHolographic(false);
                    }}
                  />
                  <span className="ml-2">
                    {countryLabels.es.esIsNotarialWill}
                  </span>
                </div>
                <div className="mt-2">
                  <input
                    type="radio"
                    name="esWillFormat"
                    value="holographic"
                    checked={esIsHolographic}
                    onChange={() => {
                      setEsIsHolographic(true);
                      setEsIsNotarialWill(false);
                    }}
                  />
                  <span className="ml-2">
                    {countryLabels.es.esIsHolographic}
                  </span>
                </div>
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

        {willText && pdfBytes && !isGenerating && (
          <div className="buttonContainer mt-4">
            <PDFDownloadButton pdfBytes={pdfBytes} />
          </div>
        )}
      </form>
    </div>
  );
}
