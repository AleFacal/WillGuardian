"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  translations: { [key: string]: string };
}

const defaultLanguage = "en";

const translationsDict: Record<string, Record<string, string>> = {
  en: {
    home: "Home",
    createWill: "Create Will",
    settings: "Settings",
    faq: "FAQ",
    language: "Language",
  },
  de: {
    home: "Startseite",
    createWill: "Testament erstellen",
    settings: "Einstellungen",
    faq: "FAQ",
    language: "Sprache",
  },
  fr: {
    home: "Accueil",
    createWill: "Créer un testament",
    settings: "Paramètres",
    faq: "FAQ",
    language: "Langue",
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: defaultLanguage,
  setLanguage: () => {},
  translations: translationsDict[defaultLanguage], // Default translations
});

export const LanguageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [language, setLanguage] = useState<string>(defaultLanguage);
  const [translations, setTranslations] = useState<{ [key: string]: string }>(
    translationsDict[defaultLanguage]
  );

  useEffect(() => {
    const storedLanguage = localStorage.getItem("appLanguage");
    if (storedLanguage && translationsDict[storedLanguage]) {
      setLanguage(storedLanguage);
      setTranslations(translationsDict[storedLanguage]);
    } else {
      setTranslations(translationsDict[defaultLanguage]); // Fallback to default language
    }
  }, []);

  const updateLanguage = (lang: string) => {
    setLanguage(lang);
    setTranslations(translationsDict[lang]);
    localStorage.setItem("appLanguage", lang);
  };

  const value: LanguageContextType = {
    language,
    setLanguage: updateLanguage,
    translations,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
