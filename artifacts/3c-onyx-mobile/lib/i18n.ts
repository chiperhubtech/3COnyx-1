import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? "en";

const SUPPORTED = ["en", "es", "fr", "pt", "de", "ar", "zh", "ja", "ko", "hi", "it", "ru", "nl"];

const resources = {
  en: {
    translation: {
      greeting: {
        morning: "GOOD MORNING",
        afternoon: "GOOD AFTERNOON",
        evening: "GOOD EVENING",
      },
      nav: {
        home: "Home",
        garage: "Garage",
        marketplace: "Market",
        wallet: "Wallet",
        concierge: "Concierge",
      },
      tabs: {
        tasks: "Tasks",
        wallet: "Wallet",
        inVehicle: "In-Vehicle",
      },
      home: {
        platformStatus: "Platform Status",
        platformOnline: "ALL SYSTEMS ONLINE",
        quickActions: "Quick Actions",
        actions: {
          concierge: "ONYX AI",
          conciergeDesc: "Concierge",
          guardian: "Guardian",
          guardianDesc: "V2X Safety",
          garage: "My Garage",
          garageDesc: "Vehicles",
          marketplace: "Market",
          marketplaceDesc: "Buy & Sell",
          wallet: "Wallet",
          walletDesc: "Dynasty",
        },
        status: {
          neuralMesh: "NEURAL MESH",
          aiAgents: "AI AGENTS",
          blockchainSync: "BLOCKCHAIN SYNC",
          securityLayer: "SECURITY LAYER",
          otaStamping: "BLOCKCHAIN OTA",
        },
      },
      marketplace: {
        title: "MARKETPLACE",
        blockchainVerified: "certified listings",
        search: "Search make, model, year...",
      },
      garage: {
        title: "MY GARAGE",
        subtitle: "Live telematics via Smartcar Connect",
        addVehicle: "Connect",
      },
      wallet: {
        title: "DYNASTY WALLET",
        subtitle: "TRIPLE-SPLIT ENGINE",
        connected: "CONNECTED",
        setupNeeded: "SETUP NEEDED",
      },
      notifications: {
        title: "NOTIFICATIONS",
        markAllRead: "Mark all read",
        unread: "UNREAD",
        earlier: "EARLIER",
        empty: "No notifications yet.",
        emptyDesc: "You're all caught up.",
      },
      common: {
        loading: "Loading...",
        error: "Something went wrong",
        retry: "Try Again",
        live: "LIVE",
        active: "ACTIVE",
        secure: "SECURE",
        connected: "CONNECTED",
      },
      poweredBy: "POWERED BY CUXTOMCANDYCLUB LLC",
    },
  },
  es: {
    translation: {
      greeting: { morning: "BUENOS DÍAS", afternoon: "BUENAS TARDES", evening: "BUENAS NOCHES" },
      nav: { home: "Inicio", garage: "Garaje", marketplace: "Mercado", wallet: "Cartera", concierge: "Conserjería" },
      tabs: { tasks: "Tareas", wallet: "Cartera", inVehicle: "En Vehículo" },
      home: {
        platformStatus: "Estado de la Plataforma", platformOnline: "TODOS LOS SISTEMAS EN LÍNEA",
        quickActions: "Acciones Rápidas",
        actions: { concierge: "ONYX IA", conciergeDesc: "Conserjería", guardian: "Guardian", guardianDesc: "Seguridad V2X", garage: "Mi Garaje", garageDesc: "Vehículos", marketplace: "Mercado", marketplaceDesc: "Comprar y Vender", wallet: "Cartera", walletDesc: "Dynasty" },
        status: { neuralMesh: "RED NEURAL", aiAgents: "AGENTES IA", blockchainSync: "SINCRONIZACIÓN BLOCKCHAIN", securityLayer: "CAPA DE SEGURIDAD", otaStamping: "OTA BLOCKCHAIN" },
      },
      marketplace: { title: "MERCADO", blockchainVerified: "listados certificados", search: "Buscar marca, modelo, año..." },
      garage: { title: "MI GARAJE", subtitle: "Telemática en vivo vía Smartcar Connect", addVehicle: "Conectar" },
      wallet: { title: "DYNASTY WALLET", subtitle: "MOTOR DE TRIPLE DIVISIÓN", connected: "CONECTADO", setupNeeded: "CONFIGURACIÓN NECESARIA" },
      notifications: { title: "NOTIFICACIONES", markAllRead: "Marcar todo como leído", unread: "NO LEÍDAS", earlier: "ANTERIORES", empty: "Aún no hay notificaciones.", emptyDesc: "Estás al día." },
      common: { loading: "Cargando...", error: "Algo salió mal", retry: "Intentar de nuevo", live: "EN VIVO", active: "ACTIVO", secure: "SEGURO", connected: "CONECTADO" },
      poweredBy: "DESARROLLADO POR CUXTOMCANDYCLUB LLC",
    },
  },
  fr: {
    translation: {
      greeting: { morning: "BONJOUR", afternoon: "BON APRÈS-MIDI", evening: "BONSOIR" },
      nav: { home: "Accueil", garage: "Garage", marketplace: "Marché", wallet: "Portefeuille", concierge: "Conciergerie" },
      tabs: { tasks: "Tâches", wallet: "Portefeuille", inVehicle: "En Véhicule" },
      home: {
        platformStatus: "État de la Plateforme", platformOnline: "TOUS LES SYSTÈMES EN LIGNE",
        quickActions: "Actions Rapides",
        actions: { concierge: "ONYX IA", conciergeDesc: "Conciergerie", guardian: "Guardian", guardianDesc: "Sécurité V2X", garage: "Mon Garage", garageDesc: "Véhicules", marketplace: "Marché", marketplaceDesc: "Acheter et Vendre", wallet: "Portefeuille", walletDesc: "Dynasty" },
        status: { neuralMesh: "RÉSEAU NEURAL", aiAgents: "AGENTS IA", blockchainSync: "SYNC BLOCKCHAIN", securityLayer: "COUCHE SÉCURITÉ", otaStamping: "OTA BLOCKCHAIN" },
      },
      marketplace: { title: "MARCHÉ", blockchainVerified: "annonces certifiées", search: "Rechercher marque, modèle, année..." },
      garage: { title: "MON GARAGE", subtitle: "Télématique en direct via Smartcar Connect", addVehicle: "Connecter" },
      wallet: { title: "DYNASTY WALLET", subtitle: "MOTEUR TRIPLE DIVISION", connected: "CONNECTÉ", setupNeeded: "CONFIGURATION REQUISE" },
      notifications: { title: "NOTIFICATIONS", markAllRead: "Tout marquer comme lu", unread: "NON LUES", earlier: "PRÉCÉDENTES", empty: "Aucune notification pour l'instant.", emptyDesc: "Vous êtes à jour." },
      common: { loading: "Chargement...", error: "Une erreur s'est produite", retry: "Réessayer", live: "EN DIRECT", active: "ACTIF", secure: "SÉCURISÉ", connected: "CONNECTÉ" },
      poweredBy: "PROPULSÉ PAR CUXTOMCANDYCLUB LLC",
    },
  },
  pt: {
    translation: {
      greeting: { morning: "BOM DIA", afternoon: "BOA TARDE", evening: "BOA NOITE" },
      nav: { home: "Início", garage: "Garagem", marketplace: "Mercado", wallet: "Carteira", concierge: "Concierge" },
      tabs: { tasks: "Tarefas", wallet: "Carteira", inVehicle: "No Veículo" },
      home: {
        platformStatus: "Status da Plataforma", platformOnline: "TODOS OS SISTEMAS ONLINE",
        quickActions: "Ações Rápidas",
        actions: { concierge: "ONYX IA", conciergeDesc: "Concierge", guardian: "Guardian", guardianDesc: "Segurança V2X", garage: "Minha Garagem", garageDesc: "Veículos", marketplace: "Mercado", marketplaceDesc: "Comprar e Vender", wallet: "Carteira", walletDesc: "Dynasty" },
        status: { neuralMesh: "REDE NEURAL", aiAgents: "AGENTES IA", blockchainSync: "SINCRONIZAÇÃO BLOCKCHAIN", securityLayer: "CAMADA DE SEGURANÇA", otaStamping: "OTA BLOCKCHAIN" },
      },
      marketplace: { title: "MERCADO", blockchainVerified: "listagens certificadas", search: "Pesquisar marca, modelo, ano..." },
      garage: { title: "MINHA GARAGEM", subtitle: "Telemetria ao vivo via Smartcar Connect", addVehicle: "Conectar" },
      wallet: { title: "DYNASTY WALLET", subtitle: "MOTOR DE TRIPLA DIVISÃO", connected: "CONECTADO", setupNeeded: "CONFIGURAÇÃO NECESSÁRIA" },
      notifications: { title: "NOTIFICAÇÕES", markAllRead: "Marcar tudo como lido", unread: "NÃO LIDAS", earlier: "ANTERIORES", empty: "Sem notificações ainda.", emptyDesc: "Você está em dia." },
      common: { loading: "Carregando...", error: "Algo deu errado", retry: "Tentar Novamente", live: "AO VIVO", active: "ATIVO", secure: "SEGURO", connected: "CONECTADO" },
      poweredBy: "DESENVOLVIDO POR CUXTOMCANDYCLUB LLC",
    },
  },
  de: {
    translation: {
      greeting: { morning: "GUTEN MORGEN", afternoon: "GUTEN NACHMITTAG", evening: "GUTEN ABEND" },
      nav: { home: "Startseite", garage: "Garage", marketplace: "Markt", wallet: "Brieftasche", concierge: "Concierge" },
      tabs: { tasks: "Aufgaben", wallet: "Brieftasche", inVehicle: "Im Fahrzeug" },
      home: {
        platformStatus: "Plattformstatus", platformOnline: "ALLE SYSTEME ONLINE",
        quickActions: "Schnellaktionen",
        actions: { concierge: "ONYX KI", conciergeDesc: "Concierge", guardian: "Guardian", guardianDesc: "V2X-Sicherheit", garage: "Meine Garage", garageDesc: "Fahrzeuge", marketplace: "Markt", marketplaceDesc: "Kaufen & Verkaufen", wallet: "Brieftasche", walletDesc: "Dynasty" },
        status: { neuralMesh: "NEURALES NETZ", aiAgents: "KI-AGENTEN", blockchainSync: "BLOCKCHAIN-SYNC", securityLayer: "SICHERHEITSSCHICHT", otaStamping: "BLOCKCHAIN OTA" },
      },
      marketplace: { title: "MARKTPLATZ", blockchainVerified: "zertifizierte Angebote", search: "Marke, Modell, Jahr suchen..." },
      garage: { title: "MEINE GARAGE", subtitle: "Live-Telematik via Smartcar Connect", addVehicle: "Verbinden" },
      wallet: { title: "DYNASTY WALLET", subtitle: "DREIFACH-TEILUNGS-MOTOR", connected: "VERBUNDEN", setupNeeded: "EINRICHTUNG ERFORDERLICH" },
      notifications: { title: "BENACHRICHTIGUNGEN", markAllRead: "Alle als gelesen markieren", unread: "UNGELESEN", earlier: "FRÜHER", empty: "Noch keine Benachrichtigungen.", emptyDesc: "Sie sind auf dem neuesten Stand." },
      common: { loading: "Laden...", error: "Etwas ist schiefgelaufen", retry: "Erneut versuchen", live: "LIVE", active: "AKTIV", secure: "SICHER", connected: "VERBUNDEN" },
      poweredBy: "BETRIEBEN VON CUXTOMCANDYCLUB LLC",
    },
  },
};

const safeLng = SUPPORTED.includes(deviceLocale) ? deviceLocale : "en";

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: safeLng,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export default i18n;
