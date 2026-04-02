import { Router, Request, Response } from "express";

const router = Router();

const MANUFACTURER_PROGRAMS: Record<string, Array<{
  programName: string;
  programCode: string;
  incentiveType: string;
  amount: number;
  percentOff?: number;
  eligibleModels: string[];
  eligibleYears: number[];
  purchaseTypes: string[];
  customerRequirements: Record<string, string>;
  stackable: boolean;
  region: string;
  description: string;
}>> = {
  Toyota: [
    { programName: "Toyota College Grad Rebate", programCode: "TY-GRAD-2026", incentiveType: "rebate", amount: 500, eligibleModels: ["Corolla", "Camry", "RAV4", "Tacoma", "C-HR", "Corolla Cross"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { education: "graduated_within_2_years" }, stackable: true, region: "US", description: "Available to recent college graduates within 2 years of graduation" },
    { programName: "Toyota Military Rebate", programCode: "TY-MIL-2026", incentiveType: "rebate", amount: 750, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { military: "active_or_veteran" }, stackable: true, region: "US", description: "Active duty, reserves, veterans, and household members" },
    { programName: "Toyota Loyalty Cash", programCode: "TY-LOYAL-2026", incentiveType: "loyalty_cash", amount: 1000, eligibleModels: ["Camry", "Highlander", "Tundra", "4Runner", "Sequoia"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase"], customerRequirements: { current_owner: "toyota_or_lexus" }, stackable: true, region: "US", description: "Current Toyota or Lexus owners trading in" },
    { programName: "Toyota APR Special", programCode: "TY-APR-2026", incentiveType: "apr_reduction", amount: 0, percentOff: 1.9, eligibleModels: ["Camry", "RAV4", "Highlander"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase"], customerRequirements: {}, stackable: false, region: "US", description: "1.9% APR for 60 months on select models" },
    { programName: "Toyota Lease Cash", programCode: "TY-LEASE-2026", incentiveType: "lease_cash", amount: 2000, eligibleModels: ["Camry", "Corolla", "RAV4", "Highlander"], eligibleYears: [2025, 2026], purchaseTypes: ["lease"], customerRequirements: {}, stackable: true, region: "US", description: "Lease cash applied to capitalized cost reduction" },
  ],
  Honda: [
    { programName: "Honda College Graduate Program", programCode: "HN-GRAD-2026", incentiveType: "rebate", amount: 500, eligibleModels: ["Civic", "HR-V", "Accord"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { education: "graduated_within_2_years" }, stackable: true, region: "US", description: "Recent graduates from accredited 2 or 4 year institutions" },
    { programName: "Honda Military Appreciation", programCode: "HN-MIL-2026", incentiveType: "rebate", amount: 500, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { military: "active_or_veteran" }, stackable: true, region: "US", description: "Active, reserve, veteran military and spouses" },
    { programName: "Honda Loyalty Bonus", programCode: "HN-LOYAL-2026", incentiveType: "loyalty_cash", amount: 750, eligibleModels: ["CR-V", "Pilot", "Passport", "Ridgeline"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase"], customerRequirements: { current_owner: "honda_or_acura" }, stackable: true, region: "US", description: "Current Honda or Acura owners" },
    { programName: "Honda APR Event", programCode: "HN-APR-2026", incentiveType: "apr_reduction", amount: 0, percentOff: 2.9, eligibleModels: ["Civic", "CR-V", "Accord"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase"], customerRequirements: {}, stackable: false, region: "US", description: "2.9% APR for 60 months through Honda Financial" },
  ],
  Ford: [
    { programName: "Ford Military Recognition", programCode: "FD-MIL-2026", incentiveType: "rebate", amount: 500, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { military: "active_veteran_retired" }, stackable: true, region: "US", description: "Active duty, retired, veterans within 24 months of separation" },
    { programName: "Ford First Responder", programCode: "FD-FR-2026", incentiveType: "rebate", amount: 750, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { occupation: "first_responder" }, stackable: true, region: "US", description: "Police, fire, EMS, and 911 dispatchers" },
    { programName: "Ford Retail Bonus Cash", programCode: "FD-BONUS-2026", incentiveType: "bonus_cash", amount: 2500, eligibleModels: ["F-150", "Explorer", "Edge", "Escape"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase"], customerRequirements: {}, stackable: true, region: "US", description: "Retail bonus cash on select models" },
    { programName: "Ford Conquest Cash", programCode: "FD-CONQ-2026", incentiveType: "conquest_cash", amount: 1000, eligibleModels: ["F-150", "Explorer", "Bronco Sport"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase"], customerRequirements: { current_owner: "competitive_brand" }, stackable: true, region: "US", description: "Owners of competitive brand vehicles switching to Ford" },
    { programName: "Ford 0% APR", programCode: "FD-APR-2026", incentiveType: "apr_reduction", amount: 0, percentOff: 0, eligibleModels: ["Escape", "Edge", "Explorer"], eligibleYears: [2025], purchaseTypes: ["purchase"], customerRequirements: {}, stackable: false, region: "US", description: "0% APR for 60 months on select 2025 models" },
  ],
  Chevrolet: [
    { programName: "Chevy Military Discount", programCode: "CV-MIL-2026", incentiveType: "rebate", amount: 750, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { military: "active_or_veteran" }, stackable: true, region: "US", description: "Military and veterans discount on all models" },
    { programName: "Chevy Loyalty Cash", programCode: "CV-LOYAL-2026", incentiveType: "loyalty_cash", amount: 2000, eligibleModels: ["Silverado", "Tahoe", "Suburban", "Traverse"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase"], customerRequirements: { current_owner: "gm_brand" }, stackable: true, region: "US", description: "Current GM vehicle owners" },
    { programName: "Chevy Bonus Cash", programCode: "CV-BONUS-2026", incentiveType: "bonus_cash", amount: 3000, eligibleModels: ["Equinox", "Malibu", "Blazer", "Trax"], eligibleYears: [2025], purchaseTypes: ["purchase"], customerRequirements: {}, stackable: true, region: "US", description: "Retail bonus on select 2025 inventory" },
    { programName: "Chevy First Responder", programCode: "CV-FR-2026", incentiveType: "rebate", amount: 750, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { occupation: "first_responder" }, stackable: true, region: "US", description: "First responders: police, fire, EMS" },
  ],
  Jeep: [
    { programName: "Jeep Military Bonus", programCode: "JP-MIL-2026", incentiveType: "rebate", amount: 500, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { military: "active_or_veteran" }, stackable: true, region: "US", description: "Active, reserve, retired military and spouses" },
    { programName: "Jeep Retail Bonus Cash", programCode: "JP-BONUS-2026", incentiveType: "bonus_cash", amount: 2000, eligibleModels: ["Cherokee", "Grand Cherokee", "Compass", "Renegade"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase"], customerRequirements: {}, stackable: true, region: "US", description: "Bonus cash on Cherokee family" },
    { programName: "Jeep Lease Loyalty", programCode: "JP-LLOY-2026", incentiveType: "loyalty_cash", amount: 1500, eligibleModels: ["Grand Cherokee", "Wrangler", "Gladiator"], eligibleYears: [2025, 2026], purchaseTypes: ["lease"], customerRequirements: { current_owner: "stellantis_brand" }, stackable: true, region: "US", description: "Current FCA/Stellantis lessees" },
    { programName: "Jeep Conquest Cash", programCode: "JP-CONQ-2026", incentiveType: "conquest_cash", amount: 1000, eligibleModels: ["Grand Cherokee", "Wrangler"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { current_owner: "competitive_brand" }, stackable: true, region: "US", description: "Switching from a competitive SUV brand" },
  ],
  Nissan: [
    { programName: "Nissan Military Program", programCode: "NS-MIL-2026", incentiveType: "rebate", amount: 500, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { military: "active_or_veteran" }, stackable: true, region: "US", description: "Active duty, retired, and veterans" },
    { programName: "Nissan College Grad", programCode: "NS-GRAD-2026", incentiveType: "rebate", amount: 500, eligibleModels: ["Sentra", "Altima", "Kicks", "Rogue"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { education: "graduated_within_2_years" }, stackable: true, region: "US", description: "Recent graduates" },
    { programName: "Nissan Bonus Cash", programCode: "NS-BONUS-2026", incentiveType: "bonus_cash", amount: 2500, eligibleModels: ["Altima", "Rogue", "Pathfinder", "Frontier"], eligibleYears: [2025], purchaseTypes: ["purchase"], customerRequirements: {}, stackable: true, region: "US", description: "Retail bonus cash on 2025 models" },
    { programName: "Nissan Loyalty Cash", programCode: "NS-LOYAL-2026", incentiveType: "loyalty_cash", amount: 1000, eligibleModels: ["Rogue", "Pathfinder", "Murano"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase"], customerRequirements: { current_owner: "nissan_or_infiniti" }, stackable: true, region: "US", description: "Current Nissan/Infiniti owners" },
  ],
  BMW: [
    { programName: "BMW Military Program", programCode: "BM-MIL-2026", incentiveType: "rebate", amount: 1000, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { military: "active_or_veteran" }, stackable: true, region: "US", description: "USAA members — active, retired, veterans" },
    { programName: "BMW College Grad", programCode: "BM-GRAD-2026", incentiveType: "rebate", amount: 1000, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { education: "graduated_within_1_year" }, stackable: true, region: "US", description: "Within 12 months of graduation" },
    { programName: "BMW Loyalty Credit", programCode: "BM-LOYAL-2026", incentiveType: "loyalty_cash", amount: 1500, eligibleModels: ["3 Series", "5 Series", "X3", "X5", "iX"], eligibleYears: [2025, 2026], purchaseTypes: ["lease"], customerRequirements: { current_owner: "bmw" }, stackable: true, region: "US", description: "Current BMW owners/lessees" },
    { programName: "BMW Conquest Bonus", programCode: "BM-CONQ-2026", incentiveType: "conquest_cash", amount: 1500, eligibleModels: ["3 Series", "X3", "X5"], eligibleYears: [2025, 2026], purchaseTypes: ["lease"], customerRequirements: { current_owner: "competitive_luxury" }, stackable: true, region: "US", description: "Switching from Audi, Mercedes, Lexus, or other luxury" },
  ],
  Mercedes: [
    { programName: "Mercedes Military Program", programCode: "MB-MIL-2026", incentiveType: "rebate", amount: 1000, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { military: "active_or_veteran" }, stackable: true, region: "US", description: "Active duty and veterans" },
    { programName: "Mercedes Loyalty Bonus", programCode: "MB-LOYAL-2026", incentiveType: "loyalty_cash", amount: 2000, eligibleModels: ["C-Class", "E-Class", "GLC", "GLE"], eligibleYears: [2025, 2026], purchaseTypes: ["lease"], customerRequirements: { current_owner: "mercedes" }, stackable: true, region: "US", description: "Current Mercedes-Benz owners/lessees" },
    { programName: "Mercedes Conquest", programCode: "MB-CONQ-2026", incentiveType: "conquest_cash", amount: 1500, eligibleModels: ["C-Class", "GLC", "GLE"], eligibleYears: [2025, 2026], purchaseTypes: ["lease"], customerRequirements: { current_owner: "competitive_luxury" }, stackable: true, region: "US", description: "Switching from BMW, Audi, Lexus" },
  ],
  Hyundai: [
    { programName: "Hyundai Military Program", programCode: "HY-MIL-2026", incentiveType: "rebate", amount: 500, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { military: "active_or_veteran" }, stackable: true, region: "US", description: "Active, retired, veterans" },
    { programName: "Hyundai College Grad", programCode: "HY-GRAD-2026", incentiveType: "rebate", amount: 400, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { education: "graduated_within_2_years" }, stackable: true, region: "US", description: "Recent 2 or 4 year graduates" },
    { programName: "Hyundai Retail Cash", programCode: "HY-BONUS-2026", incentiveType: "bonus_cash", amount: 2000, eligibleModels: ["Tucson", "Santa Fe", "Elantra", "Sonata"], eligibleYears: [2025], purchaseTypes: ["purchase"], customerRequirements: {}, stackable: true, region: "US", description: "Retail bonus on 2025 models" },
    { programName: "Hyundai Loyalty Cash", programCode: "HY-LOYAL-2026", incentiveType: "loyalty_cash", amount: 1000, eligibleModels: ["Tucson", "Santa Fe", "Palisade"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase"], customerRequirements: { current_owner: "hyundai_or_genesis" }, stackable: true, region: "US", description: "Returning Hyundai or Genesis owners" },
  ],
  Kia: [
    { programName: "Kia Military Discount", programCode: "KA-MIL-2026", incentiveType: "rebate", amount: 500, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { military: "active_or_veteran" }, stackable: true, region: "US", description: "Active duty and veterans" },
    { programName: "Kia Bonus Cash", programCode: "KA-BONUS-2026", incentiveType: "bonus_cash", amount: 2500, eligibleModels: ["Forte", "K5", "Sportage", "Sorento", "Telluride"], eligibleYears: [2025], purchaseTypes: ["purchase"], customerRequirements: {}, stackable: true, region: "US", description: "Retail bonus on select 2025 models" },
    { programName: "Kia Loyalty Cash", programCode: "KA-LOYAL-2026", incentiveType: "loyalty_cash", amount: 750, eligibleModels: ["Sportage", "Sorento", "Telluride", "EV6"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase"], customerRequirements: { current_owner: "kia_or_hyundai" }, stackable: true, region: "US", description: "Returning Kia or Hyundai owners" },
  ],
  Tesla: [
    { programName: "Tesla Federal EV Tax Credit", programCode: "TS-EV-2026", incentiveType: "tax_credit", amount: 7500, eligibleModels: ["Model 3", "Model Y"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase"], customerRequirements: { income: "under_agi_limit" }, stackable: true, region: "US", description: "Federal EV tax credit — income limits apply ($150K single, $300K joint)" },
    { programName: "Tesla Referral Bonus", programCode: "TS-REF-2026", incentiveType: "referral_credit", amount: 500, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase"], customerRequirements: { referral: "existing_owner" }, stackable: true, region: "US", description: "Referral credit from existing Tesla owner" },
  ],
  Subaru: [
    { programName: "Subaru Military Program", programCode: "SB-MIL-2026", incentiveType: "rebate", amount: 500, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { military: "active_or_veteran" }, stackable: true, region: "US", description: "Active, reserve, veteran military" },
    { programName: "Subaru Loyalty Coupon", programCode: "SB-LOYAL-2026", incentiveType: "loyalty_cash", amount: 500, eligibleModels: ["Outback", "Forester", "Crosstrek", "Ascent"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { current_owner: "subaru" }, stackable: true, region: "US", description: "Current Subaru owners" },
    { programName: "Subaru Bonus Cash", programCode: "SB-BONUS-2026", incentiveType: "bonus_cash", amount: 1500, eligibleModels: ["Outback", "Legacy", "Ascent"], eligibleYears: [2025], purchaseTypes: ["purchase"], customerRequirements: {}, stackable: true, region: "US", description: "Retail bonus on select 2025 inventory" },
  ],
  Dodge: [
    { programName: "Dodge Military Bonus", programCode: "DG-MIL-2026", incentiveType: "rebate", amount: 500, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { military: "active_or_veteran" }, stackable: true, region: "US", description: "Active, retired military" },
    { programName: "Dodge Bonus Cash", programCode: "DG-BONUS-2026", incentiveType: "bonus_cash", amount: 3000, eligibleModels: ["Charger", "Durango", "Hornet"], eligibleYears: [2025], purchaseTypes: ["purchase"], customerRequirements: {}, stackable: true, region: "US", description: "Retail bonus on remaining 2025 inventory" },
    { programName: "Dodge Conquest", programCode: "DG-CONQ-2026", incentiveType: "conquest_cash", amount: 1000, eligibleModels: ["Charger", "Durango"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase"], customerRequirements: { current_owner: "competitive_brand" }, stackable: true, region: "US", description: "Coming from a competitive brand" },
  ],
  Ram: [
    { programName: "Ram Military", programCode: "RM-MIL-2026", incentiveType: "rebate", amount: 500, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { military: "active_or_veteran" }, stackable: true, region: "US", description: "Active and retired military" },
    { programName: "Ram Bonus Cash", programCode: "RM-BONUS-2026", incentiveType: "bonus_cash", amount: 4000, eligibleModels: ["1500", "2500", "3500"], eligibleYears: [2025], purchaseTypes: ["purchase"], customerRequirements: {}, stackable: true, region: "US", description: "Retail bonus on 2025 Ram trucks" },
    { programName: "Ram Conquest", programCode: "RM-CONQ-2026", incentiveType: "conquest_cash", amount: 1500, eligibleModels: ["1500"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase"], customerRequirements: { current_owner: "competitive_truck" }, stackable: true, region: "US", description: "Switching from F-150, Silverado, Tundra, Titan" },
    { programName: "Ram Loyalty", programCode: "RM-LOYAL-2026", incentiveType: "loyalty_cash", amount: 2000, eligibleModels: ["1500", "2500"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase"], customerRequirements: { current_owner: "ram_or_stellantis" }, stackable: true, region: "US", description: "Current Ram/Stellantis owners" },
  ],
  Volkswagen: [
    { programName: "VW Military/First Responder", programCode: "VW-MIL-2026", incentiveType: "rebate", amount: 500, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { military: "active_or_veteran_or_first_responder" }, stackable: true, region: "US", description: "Military, veterans, and first responders" },
    { programName: "VW Loyalty Bonus", programCode: "VW-LOYAL-2026", incentiveType: "loyalty_cash", amount: 1000, eligibleModels: ["Jetta", "Tiguan", "Atlas", "ID.4"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { current_owner: "vw_or_audi" }, stackable: true, region: "US", description: "Current VW or Audi owners" },
    { programName: "VW Retail Cash", programCode: "VW-BONUS-2026", incentiveType: "bonus_cash", amount: 2000, eligibleModels: ["Jetta", "Tiguan", "Atlas"], eligibleYears: [2025], purchaseTypes: ["purchase"], customerRequirements: {}, stackable: true, region: "US", description: "Bonus cash on 2025 inventory" },
  ],
  Lexus: [
    { programName: "Lexus Military", programCode: "LX-MIL-2026", incentiveType: "rebate", amount: 1000, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { military: "active_or_veteran" }, stackable: true, region: "US", description: "Active duty, retired, veterans" },
    { programName: "Lexus Loyalty Cash", programCode: "LX-LOYAL-2026", incentiveType: "loyalty_cash", amount: 1500, eligibleModels: ["RX", "NX", "ES", "IS", "GX"], eligibleYears: [2025, 2026], purchaseTypes: ["lease"], customerRequirements: { current_owner: "lexus_or_toyota" }, stackable: true, region: "US", description: "Current Lexus or Toyota owners/lessees" },
    { programName: "Lexus Conquest", programCode: "LX-CONQ-2026", incentiveType: "conquest_cash", amount: 1500, eligibleModels: ["NX", "RX", "IS"], eligibleYears: [2025, 2026], purchaseTypes: ["lease"], customerRequirements: { current_owner: "competitive_luxury" }, stackable: true, region: "US", description: "Switching from BMW, Mercedes, Audi, Infiniti" },
  ],
  Acura: [
    { programName: "Acura Military", programCode: "AC-MIL-2026", incentiveType: "rebate", amount: 750, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { military: "active_or_veteran" }, stackable: true, region: "US", description: "Military appreciation" },
    { programName: "Acura Loyalty Cash", programCode: "AC-LOYAL-2026", incentiveType: "loyalty_cash", amount: 1000, eligibleModels: ["MDX", "RDX", "TLX", "Integra"], eligibleYears: [2025, 2026], purchaseTypes: ["lease"], customerRequirements: { current_owner: "acura_or_honda" }, stackable: true, region: "US", description: "Current Acura or Honda owners/lessees" },
    { programName: "Acura Conquest", programCode: "AC-CONQ-2026", incentiveType: "conquest_cash", amount: 1000, eligibleModels: ["MDX", "RDX", "TLX"], eligibleYears: [2025, 2026], purchaseTypes: ["lease"], customerRequirements: { current_owner: "competitive_luxury" }, stackable: true, region: "US", description: "Switching from competitive luxury brand" },
  ],
  GMC: [
    { programName: "GMC Military", programCode: "GM-MIL-2026", incentiveType: "rebate", amount: 750, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { military: "active_or_veteran" }, stackable: true, region: "US", description: "Military discount on all models" },
    { programName: "GMC Loyalty Cash", programCode: "GM-LOYAL-2026", incentiveType: "loyalty_cash", amount: 2000, eligibleModels: ["Sierra", "Yukon", "Terrain", "Acadia"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase"], customerRequirements: { current_owner: "gm_brand" }, stackable: true, region: "US", description: "Current GM brand owners" },
    { programName: "GMC Bonus Cash", programCode: "GM-BONUS-2026", incentiveType: "bonus_cash", amount: 3000, eligibleModels: ["Sierra", "Terrain", "Acadia"], eligibleYears: [2025], purchaseTypes: ["purchase"], customerRequirements: {}, stackable: true, region: "US", description: "Retail bonus on 2025 inventory" },
  ],
  Lincoln: [
    { programName: "Lincoln Military", programCode: "LN-MIL-2026", incentiveType: "rebate", amount: 1000, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { military: "active_or_veteran" }, stackable: true, region: "US", description: "Military program" },
    { programName: "Lincoln Loyalty", programCode: "LN-LOYAL-2026", incentiveType: "loyalty_cash", amount: 2000, eligibleModels: ["Corsair", "Nautilus", "Aviator", "Navigator"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { current_owner: "lincoln_or_ford" }, stackable: true, region: "US", description: "Current Lincoln or Ford owners" },
    { programName: "Lincoln Conquest", programCode: "LN-CONQ-2026", incentiveType: "conquest_cash", amount: 1500, eligibleModels: ["Corsair", "Nautilus", "Aviator"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { current_owner: "competitive_luxury" }, stackable: true, region: "US", description: "Switching from competitive luxury" },
  ],
  Cadillac: [
    { programName: "Cadillac Military", programCode: "CD-MIL-2026", incentiveType: "rebate", amount: 750, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { military: "active_or_veteran" }, stackable: true, region: "US", description: "Military program" },
    { programName: "Cadillac Loyalty", programCode: "CD-LOYAL-2026", incentiveType: "loyalty_cash", amount: 2000, eligibleModels: ["CT4", "CT5", "XT4", "XT5", "XT6", "Escalade", "LYRIQ"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { current_owner: "cadillac_or_gm" }, stackable: true, region: "US", description: "Current Cadillac or GM owners/lessees" },
    { programName: "Cadillac Conquest", programCode: "CD-CONQ-2026", incentiveType: "conquest_cash", amount: 2000, eligibleModels: ["CT5", "XT5", "LYRIQ"], eligibleYears: [2025, 2026], purchaseTypes: ["lease"], customerRequirements: { current_owner: "competitive_luxury" }, stackable: true, region: "US", description: "Switching from competitive luxury brand" },
  ],
  Mazda: [
    { programName: "Mazda Military", programCode: "MZ-MIL-2026", incentiveType: "rebate", amount: 500, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { military: "active_or_veteran" }, stackable: true, region: "US", description: "Active and retired military" },
    { programName: "Mazda Loyalty Bonus", programCode: "MZ-LOYAL-2026", incentiveType: "loyalty_cash", amount: 750, eligibleModels: ["CX-5", "CX-50", "CX-90", "CX-70", "Mazda3"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { current_owner: "mazda" }, stackable: true, region: "US", description: "Returning Mazda owners" },
    { programName: "Mazda Bonus Cash", programCode: "MZ-BONUS-2026", incentiveType: "bonus_cash", amount: 1500, eligibleModels: ["CX-5", "CX-50", "CX-90"], eligibleYears: [2025], purchaseTypes: ["purchase"], customerRequirements: {}, stackable: true, region: "US", description: "Retail bonus on select 2025 models" },
  ],
  Audi: [
    { programName: "Audi Military", programCode: "AU-MIL-2026", incentiveType: "rebate", amount: 1000, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { military: "active_or_veteran" }, stackable: true, region: "US", description: "Active duty and veterans" },
    { programName: "Audi Loyalty", programCode: "AU-LOYAL-2026", incentiveType: "loyalty_cash", amount: 1500, eligibleModels: ["A4", "A6", "Q5", "Q7", "Q8", "e-tron"], eligibleYears: [2025, 2026], purchaseTypes: ["lease"], customerRequirements: { current_owner: "audi_or_vw" }, stackable: true, region: "US", description: "Current Audi or VW owners/lessees" },
    { programName: "Audi Conquest", programCode: "AU-CONQ-2026", incentiveType: "conquest_cash", amount: 1500, eligibleModels: ["Q5", "A4", "Q7"], eligibleYears: [2025, 2026], purchaseTypes: ["lease"], customerRequirements: { current_owner: "competitive_luxury" }, stackable: true, region: "US", description: "Switching from BMW, Mercedes, Lexus" },
  ],
  Infiniti: [
    { programName: "Infiniti Military", programCode: "IN-MIL-2026", incentiveType: "rebate", amount: 750, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { military: "active_or_veteran" }, stackable: true, region: "US", description: "Military discount" },
    { programName: "Infiniti Loyalty", programCode: "IN-LOYAL-2026", incentiveType: "loyalty_cash", amount: 1500, eligibleModels: ["QX50", "QX55", "QX60", "QX80"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { current_owner: "infiniti_or_nissan" }, stackable: true, region: "US", description: "Current Infiniti or Nissan owners" },
    { programName: "Infiniti Conquest", programCode: "IN-CONQ-2026", incentiveType: "conquest_cash", amount: 2000, eligibleModels: ["QX60", "QX80"], eligibleYears: [2025, 2026], purchaseTypes: ["lease"], customerRequirements: { current_owner: "competitive_luxury" }, stackable: true, region: "US", description: "Switching from competitive luxury" },
  ],
  Volvo: [
    { programName: "Volvo Military", programCode: "VO-MIL-2026", incentiveType: "rebate", amount: 1000, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { military: "active_or_veteran" }, stackable: true, region: "US", description: "Military appreciation" },
    { programName: "Volvo Loyalty", programCode: "VO-LOYAL-2026", incentiveType: "loyalty_cash", amount: 1500, eligibleModels: ["XC40", "XC60", "XC90", "S60"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { current_owner: "volvo" }, stackable: true, region: "US", description: "Returning Volvo owners" },
    { programName: "Volvo Conquest", programCode: "VO-CONQ-2026", incentiveType: "conquest_cash", amount: 1000, eligibleModels: ["XC60", "XC90", "S60"], eligibleYears: [2025, 2026], purchaseTypes: ["lease"], customerRequirements: { current_owner: "competitive_luxury" }, stackable: true, region: "US", description: "Switching from competitive luxury" },
  ],
  Mitsubishi: [
    { programName: "Mitsubishi Military", programCode: "MT-MIL-2026", incentiveType: "rebate", amount: 500, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { military: "active_or_veteran" }, stackable: true, region: "US", description: "Military program" },
    { programName: "Mitsubishi Retail Bonus", programCode: "MT-BONUS-2026", incentiveType: "bonus_cash", amount: 2000, eligibleModels: ["Outlander", "Outlander Sport", "Eclipse Cross", "Mirage"], eligibleYears: [2025], purchaseTypes: ["purchase"], customerRequirements: {}, stackable: true, region: "US", description: "Retail bonus on 2025 models" },
  ],
  Genesis: [
    { programName: "Genesis Military", programCode: "GN-MIL-2026", incentiveType: "rebate", amount: 1000, eligibleModels: ["all"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { military: "active_or_veteran" }, stackable: true, region: "US", description: "Military appreciation" },
    { programName: "Genesis Loyalty", programCode: "GN-LOYAL-2026", incentiveType: "loyalty_cash", amount: 1500, eligibleModels: ["G70", "G80", "G90", "GV70", "GV80"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase", "lease"], customerRequirements: { current_owner: "genesis_or_hyundai" }, stackable: true, region: "US", description: "Current Genesis or Hyundai owners" },
    { programName: "Genesis Conquest", programCode: "GN-CONQ-2026", incentiveType: "conquest_cash", amount: 2000, eligibleModels: ["GV70", "GV80", "G80"], eligibleYears: [2025, 2026], purchaseTypes: ["lease"], customerRequirements: { current_owner: "competitive_luxury" }, stackable: true, region: "US", description: "Switching from BMW, Mercedes, Audi, Lexus" },
  ],
  Rivian: [
    { programName: "Rivian Federal EV Credit", programCode: "RV-EV-2026", incentiveType: "tax_credit", amount: 7500, eligibleModels: ["R1T", "R1S"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase"], customerRequirements: { income: "under_agi_limit" }, stackable: true, region: "US", description: "Federal EV tax credit — income limits apply" },
    { programName: "Rivian Referral", programCode: "RV-REF-2026", incentiveType: "referral_credit", amount: 750, eligibleModels: ["R1T", "R1S"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase"], customerRequirements: { referral: "existing_owner" }, stackable: true, region: "US", description: "Referral credit from existing Rivian owner" },
  ],
  Lucid: [
    { programName: "Lucid Federal EV Credit", programCode: "LC-EV-2026", incentiveType: "tax_credit", amount: 7500, eligibleModels: ["Air", "Gravity"], eligibleYears: [2025, 2026], purchaseTypes: ["purchase"], customerRequirements: { income: "under_agi_limit" }, stackable: true, region: "US", description: "Federal EV tax credit — income limits apply" },
  ],
};

const STATE_EV_INCENTIVES: Record<string, { name: string; amount: number; type: string }> = {
  CA: { name: "California Clean Vehicle Rebate (CVRP)", amount: 2000, type: "ev_rebate" },
  CO: { name: "Colorado EV Tax Credit", amount: 5000, type: "ev_tax_credit" },
  CT: { name: "Connecticut CHEAPR Rebate", amount: 2250, type: "ev_rebate" },
  DE: { name: "Delaware Clean Vehicle Rebate", amount: 2500, type: "ev_rebate" },
  MA: { name: "Massachusetts MOR-EV", amount: 3500, type: "ev_rebate" },
  MD: { name: "Maryland EV Excise Tax Credit", amount: 3000, type: "ev_tax_credit" },
  ME: { name: "Maine EV Rebate", amount: 2000, type: "ev_rebate" },
  NJ: { name: "New Jersey EV Incentive", amount: 4000, type: "ev_incentive" },
  NY: { name: "New York Drive Clean Rebate", amount: 2000, type: "ev_rebate" },
  OR: { name: "Oregon Clean Vehicle Rebate", amount: 2500, type: "ev_rebate" },
  PA: { name: "Pennsylvania Alt Fuel Vehicle Rebate", amount: 2000, type: "ev_rebate" },
  RI: { name: "Rhode Island DRIVE EV Rebate", amount: 2500, type: "ev_rebate" },
  VT: { name: "Vermont EV Incentive", amount: 3000, type: "ev_incentive" },
  WA: { name: "Washington State EV Sales Tax Exemption", amount: 2500, type: "ev_exemption" },
};

const EV_BRANDS = ["Tesla", "Rivian", "Lucid"];
const EV_MODELS = ["ID.4", "e-tron", "iX", "i4", "LYRIQ", "Ioniq", "EV6", "Model 3", "Model Y", "Model S", "Model X", "Cybertruck", "R1T", "R1S", "Air", "Gravity"];

interface CustomerProfile {
  military?: boolean;
  firstResponder?: boolean;
  recentGraduate?: boolean;
  currentVehicleBrand?: string;
  incomeUnderAgiLimit?: boolean;
  hasReferral?: boolean;
  purchaseType?: "purchase" | "lease";
}

interface MatchRequest {
  vin?: string;
  make: string;
  model?: string;
  year?: number;
  zipCode: string;
  customerProfile: CustomerProfile;
}

interface MatchedIncentive {
  programName: string;
  programCode: string;
  incentiveType: string;
  amount: number;
  percentOff?: number;
  stackable: boolean;
  reason: string;
  verificationRequired: string[];
}

function getStateFromZip(zip: string): string | null {
  const zipNum = parseInt(zip.substring(0, 3));
  if (zipNum >= 1 && zipNum <= 2) return "MA";
  if (zipNum >= 3 && zipNum <= 4) return "NH";
  if (zipNum === 5) return "VT";
  if (zipNum >= 6 && zipNum <= 9) return "CT";
  if (zipNum >= 10 && zipNum <= 14) return "MA";
  if (zipNum >= 15 && zipNum <= 16) return "MA";
  if (zipNum >= 17 && zipNum <= 19) return "MA";
  if (zipNum >= 20 && zipNum <= 27) return "MA";
  if (zipNum >= 28 && zipNum <= 29) return "RI";
  if (zipNum >= 30 && zipNum <= 38) return "NH";
  if (zipNum >= 39 && zipNum <= 49) return "ME";
  if (zipNum >= 50 && zipNum <= 54) return "VT";
  if (zipNum >= 55 && zipNum <= 59) return "MA";
  if (zipNum >= 60 && zipNum <= 69) return "CT";
  if (zipNum >= 70 && zipNum <= 89) return "NJ";
  if (zipNum >= 100 && zipNum <= 149) return "NY";
  if (zipNum >= 150 && zipNum <= 196) return "PA";
  if (zipNum >= 197 && zipNum <= 199) return "DE";
  if (zipNum >= 200 && zipNum <= 205) return "DC";
  if (zipNum >= 206 && zipNum <= 219) return "MD";
  if (zipNum >= 220 && zipNum <= 246) return "VA";
  if (zipNum >= 247 && zipNum <= 268) return "WV";
  if (zipNum >= 270 && zipNum <= 289) return "NC";
  if (zipNum >= 290 && zipNum <= 299) return "SC";
  if (zipNum >= 300 && zipNum <= 319) return "GA";
  if (zipNum >= 320 && zipNum <= 349) return "FL";
  if (zipNum >= 350 && zipNum <= 369) return "AL";
  if (zipNum >= 370 && zipNum <= 385) return "TN";
  if (zipNum >= 386 && zipNum <= 397) return "MS";
  if (zipNum >= 400 && zipNum <= 427) return "KY";
  if (zipNum >= 430 && zipNum <= 459) return "OH";
  if (zipNum >= 460 && zipNum <= 479) return "IN";
  if (zipNum >= 480 && zipNum <= 499) return "MI";
  if (zipNum >= 500 && zipNum <= 528) return "IA";
  if (zipNum >= 530 && zipNum <= 549) return "WI";
  if (zipNum >= 550 && zipNum <= 567) return "MN";
  if (zipNum >= 570 && zipNum <= 577) return "SD";
  if (zipNum >= 580 && zipNum <= 588) return "ND";
  if (zipNum >= 590 && zipNum <= 599) return "MT";
  if (zipNum >= 600 && zipNum <= 629) return "IL";
  if (zipNum >= 630 && zipNum <= 658) return "MO";
  if (zipNum >= 660 && zipNum <= 679) return "KS";
  if (zipNum >= 680 && zipNum <= 693) return "NE";
  if (zipNum >= 700 && zipNum <= 714) return "LA";
  if (zipNum >= 716 && zipNum <= 729) return "AR";
  if (zipNum >= 730 && zipNum <= 749) return "OK";
  if (zipNum >= 750 && zipNum <= 799) return "TX";
  if (zipNum >= 800 && zipNum <= 816) return "CO";
  if (zipNum >= 820 && zipNum <= 831) return "WY";
  if (zipNum >= 832 && zipNum <= 838) return "ID";
  if (zipNum >= 840 && zipNum <= 847) return "UT";
  if (zipNum >= 850 && zipNum <= 865) return "AZ";
  if (zipNum >= 870 && zipNum <= 884) return "NM";
  if (zipNum >= 889 && zipNum <= 898) return "NV";
  if (zipNum >= 900 && zipNum <= 961) return "CA";
  if (zipNum >= 967 && zipNum <= 968) return "HI";
  if (zipNum >= 970 && zipNum <= 979) return "OR";
  if (zipNum >= 980 && zipNum <= 994) return "WA";
  if (zipNum >= 995 && zipNum <= 999) return "AK";
  return null;
}

const BRAND_FAMILIES: Record<string, string[]> = {
  toyota_or_lexus: ["toyota", "lexus"],
  honda_or_acura: ["honda", "acura"],
  gm_brand: ["chevrolet", "chevy", "gmc", "buick", "cadillac"],
  cadillac_or_gm: ["cadillac", "chevrolet", "chevy", "gmc", "buick"],
  stellantis_brand: ["jeep", "dodge", "ram", "chrysler", "fiat", "alfa romeo", "maserati"],
  ram_or_stellantis: ["ram", "jeep", "dodge", "chrysler", "fiat"],
  nissan_or_infiniti: ["nissan", "infiniti"],
  infiniti_or_nissan: ["infiniti", "nissan"],
  hyundai_or_genesis: ["hyundai", "genesis"],
  genesis_or_hyundai: ["genesis", "hyundai"],
  kia_or_hyundai: ["kia", "hyundai"],
  bmw: ["bmw"],
  mercedes: ["mercedes", "mercedes-benz"],
  subaru: ["subaru"],
  mazda: ["mazda"],
  volvo: ["volvo"],
  lincoln_or_ford: ["lincoln", "ford"],
  vw_or_audi: ["volkswagen", "vw", "audi"],
  audi_or_vw: ["audi", "volkswagen", "vw"],
  competitive_luxury: ["bmw", "mercedes", "audi", "lexus", "infiniti", "acura", "genesis", "volvo", "cadillac", "lincoln", "porsche", "land rover", "jaguar"],
};

function matchesBrandFamily(rule: string, ownerBrand: string): boolean {
  const family = BRAND_FAMILIES[rule];
  if (!family) return true;
  return family.some(b => ownerBrand.includes(b));
}

function isSameBrandFamily(targetMake: string, ownerBrand: string): boolean {
  const targetLower = targetMake.toLowerCase();
  for (const brands of Object.values(BRAND_FAMILIES)) {
    if (brands.includes(targetLower) && brands.some(b => ownerBrand.includes(b))) {
      return true;
    }
  }
  return targetLower === ownerBrand;
}

function matchIncentives(request: MatchRequest): MatchedIncentive[] {
  const matched: MatchedIncentive[] = [];
  const make = request.make;
  const programs = MANUFACTURER_PROGRAMS[make];

  if (!programs) return matched;

  const profile = request.customerProfile;
  const purchaseType = profile.purchaseType || "purchase";

  for (const program of programs) {
    if (!program.purchaseTypes.includes(purchaseType)) continue;

    const modelMatch = program.eligibleModels.includes("all") ||
      (request.model && program.eligibleModels.some(m => m.toLowerCase() === request.model!.toLowerCase()));
    if (!modelMatch) continue;

    if (request.year && program.eligibleYears.length > 0 && !program.eligibleYears.includes(request.year)) continue;

    const reqs = program.customerRequirements;
    const verificationRequired: string[] = [];
    let qualifies = true;

    if (reqs.military) {
      if (!profile.military) { qualifies = false; continue; }
      verificationRequired.push("Military ID or DD-214");
    }
    if (reqs.occupation === "first_responder") {
      if (!profile.firstResponder) { qualifies = false; continue; }
      verificationRequired.push("First responder credentials");
    }
    if (reqs.education) {
      if (!profile.recentGraduate) { qualifies = false; continue; }
      verificationRequired.push("Diploma or transcript within qualifying period");
    }
    if (reqs.current_owner) {
      if (!profile.currentVehicleBrand) { qualifies = false; continue; }
      const ownerBrand = profile.currentVehicleBrand.toLowerCase();
      const rule = reqs.current_owner;
      let brandMatch = false;
      if (rule === "competitive_brand" || rule === "competitive_luxury" || rule === "competitive_truck") {
        brandMatch = !isSameBrandFamily(make, ownerBrand);
      } else {
        brandMatch = matchesBrandFamily(rule, ownerBrand);
      }
      if (!brandMatch) { qualifies = false; continue; }
      verificationRequired.push("Current vehicle registration");
    }
    if (reqs.income) {
      if (!profile.incomeUnderAgiLimit) { qualifies = false; continue; }
      verificationRequired.push("Tax return or income verification");
    }
    if (reqs.referral) {
      if (!profile.hasReferral) { qualifies = false; continue; }
      verificationRequired.push("Referral code from existing owner");
    }

    if (qualifies) {
      matched.push({
        programName: program.programName,
        programCode: program.programCode,
        incentiveType: program.incentiveType,
        amount: program.amount,
        percentOff: program.percentOff,
        stackable: program.stackable,
        reason: program.description,
        verificationRequired,
      });
    }
  }

  const state = getStateFromZip(request.zipCode);
  const isEV = EV_BRANDS.includes(make) || (request.model && EV_MODELS.some(m => m.toLowerCase() === request.model!.toLowerCase()));
  if (isEV && state && STATE_EV_INCENTIVES[state]) {
    const stateIncentive = STATE_EV_INCENTIVES[state];
    matched.push({
      programName: stateIncentive.name,
      programCode: `STATE-${state}-EV`,
      incentiveType: stateIncentive.type,
      amount: stateIncentive.amount,
      stackable: true,
      reason: `State-level EV incentive for ${state} residents`,
      verificationRequired: ["Proof of residency", "Vehicle registration in-state"],
    });
  }

  return matched;
}

function calculateTotalSavings(incentives: MatchedIncentive[]): { cashSavings: number; aprSavings: number | null; taxCredits: number; totalEstimated: number; stackabilityNote: string | null } {
  let cashSavings = 0;
  let aprSavings: number | null = null;
  let taxCredits = 0;
  let hasNonStackable = false;
  let highestNonStackable = 0;

  const stackable = incentives.filter(i => i.stackable);
  const nonStackable = incentives.filter(i => !i.stackable);

  for (const inc of stackable) {
    if (inc.incentiveType === "tax_credit" || inc.incentiveType === "ev_tax_credit") {
      taxCredits += inc.amount;
    } else if (inc.incentiveType === "apr_reduction") {
      aprSavings = inc.percentOff || null;
    } else {
      cashSavings += inc.amount;
    }
  }

  let stackabilityNote: string | null = null;
  if (nonStackable.length > 0) {
    hasNonStackable = true;
    const bestNonStackable = nonStackable.reduce((best, curr) => curr.amount > best.amount ? curr : best);
    highestNonStackable = bestNonStackable.amount;
    if (bestNonStackable.incentiveType === "apr_reduction") {
      aprSavings = bestNonStackable.percentOff || null;
    } else {
      cashSavings += bestNonStackable.amount;
    }
    stackabilityNote = `${nonStackable.length} non-stackable incentive(s) found — best one applied: ${bestNonStackable.programName}`;
  }

  return {
    cashSavings,
    aprSavings,
    taxCredits,
    totalEstimated: cashSavings + taxCredits,
    stackabilityNote,
  };
}

router.get("/status", (_req: Request, res: Response) => {
  const totalPrograms = Object.values(MANUFACTURER_PROGRAMS).reduce((sum, progs) => sum + progs.length, 0);
  res.json({
    protocol: "3C ONYX — OEM Incentives Engine",
    version: "1.0.0",
    description: "VIN + ZIP + Customer Profile → Exact discounts and rebates. Every brand. Every program.",
    manufacturersSupported: Object.keys(MANUFACTURER_PROGRAMS).length,
    totalPrograms,
    stateEvIncentives: Object.keys(STATE_EV_INCENTIVES).length,
    incentiveTypes: ["rebate", "bonus_cash", "loyalty_cash", "conquest_cash", "apr_reduction", "lease_cash", "tax_credit", "referral_credit", "ev_rebate", "ev_incentive", "ev_exemption"],
    architect: "Ronald Antonio Cadet",
    entity: "CUXTOMCANDYCLUB LLC",
  });
});

router.get("/manufacturers", (_req: Request, res: Response) => {
  const manufacturers = Object.entries(MANUFACTURER_PROGRAMS).map(([name, programs]) => ({
    name,
    programCount: programs.length,
    incentiveTypes: [...new Set(programs.map(p => p.incentiveType))],
  }));
  res.json({ manufacturers, total: manufacturers.length });
});

router.get("/programs/:manufacturer", (req: Request, res: Response) => {
  const make = req.params.manufacturer;
  const normalizedMake = Object.keys(MANUFACTURER_PROGRAMS).find(k => k.toLowerCase() === make.toLowerCase());
  if (!normalizedMake) {
    res.status(404).json({ error: `Manufacturer "${make}" not found`, available: Object.keys(MANUFACTURER_PROGRAMS) });
    return;
  }
  res.json({
    manufacturer: normalizedMake,
    programs: MANUFACTURER_PROGRAMS[normalizedMake],
    count: MANUFACTURER_PROGRAMS[normalizedMake].length,
  });
});

router.post("/match", (req: Request, res: Response) => {
  try {
    const { vin, make, model, year, zipCode, customerProfile } = req.body;

    if (!make) {
      res.status(400).json({ error: "make is required (e.g., 'Toyota', 'Ford', 'BMW')" });
      return;
    }
    if (!zipCode || !/^\d{5}$/.test(zipCode)) {
      res.status(400).json({ error: "Valid 5-digit zipCode is required" });
      return;
    }

    const normalizedMake = Object.keys(MANUFACTURER_PROGRAMS).find(k => k.toLowerCase() === make.toLowerCase());
    if (!normalizedMake) {
      res.status(404).json({
        error: `No incentive programs found for "${make}"`,
        available: Object.keys(MANUFACTURER_PROGRAMS),
        tip: "Every brand has programs — check spelling or try the /manufacturers endpoint",
      });
      return;
    }

    const profile: CustomerProfile = customerProfile || {};
    const matchRequest: MatchRequest = {
      vin,
      make: normalizedMake,
      model,
      year: year ? parseInt(year) : undefined,
      zipCode,
      customerProfile: profile,
    };

    const incentives = matchIncentives(matchRequest);
    const savings = calculateTotalSavings(incentives);
    const state = getStateFromZip(zipCode);

    let vehicleLabel = "";
    if (year) vehicleLabel += `${year} `;
    vehicleLabel += normalizedMake;
    if (model) vehicleLabel += ` ${model}`;

    res.json({
      success: true,
      vehicle: vehicleLabel.trim(),
      vin: vin || null,
      zipCode,
      state,
      customerFactors: {
        military: profile.military || false,
        firstResponder: profile.firstResponder || false,
        recentGraduate: profile.recentGraduate || false,
        currentVehicleBrand: profile.currentVehicleBrand || null,
        incomeUnderAgiLimit: profile.incomeUnderAgiLimit || false,
        hasReferral: profile.hasReferral || false,
        purchaseType: profile.purchaseType || "purchase",
      },
      matchedIncentives: incentives,
      savings: {
        ...savings,
        formatted: `$${savings.totalEstimated.toLocaleString()} in total estimated savings`,
      },
      allDocumentsNeeded: [...new Set(incentives.flatMap(i => i.verificationRequired))],
      note: incentives.length === 0
        ? `No matching programs found for this specific profile. Try adjusting customer factors — ${normalizedMake} has ${MANUFACTURER_PROGRAMS[normalizedMake].length} active programs.`
        : `Found ${incentives.length} matching program${incentives.length > 1 ? "s" : ""} — total estimated savings: $${savings.totalEstimated.toLocaleString()}`,
      architect: "Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC",
    });
  } catch (err: any) {
    console.error("[oem-incentives] Match error:", err);
    res.status(500).json({ error: "Failed to match incentives", details: err.message });
  }
});

router.post("/quick-match", (req: Request, res: Response) => {
  try {
    const { make, zipCode } = req.body;

    if (!make || !zipCode) {
      res.status(400).json({ error: "make and zipCode are required for quick match" });
      return;
    }

    const normalizedMake = Object.keys(MANUFACTURER_PROGRAMS).find(k => k.toLowerCase() === make.toLowerCase());
    if (!normalizedMake) {
      res.status(404).json({ error: `Manufacturer "${make}" not found` });
      return;
    }

    const allPrograms = MANUFACTURER_PROGRAMS[normalizedMake];
    const universalPrograms = allPrograms.filter(p =>
      Object.keys(p.customerRequirements).length === 0
    );

    const state = getStateFromZip(zipCode);
    const maxPossible = allPrograms.reduce((sum, p) => sum + p.amount, 0);
    const guaranteedSavings = universalPrograms.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      success: true,
      manufacturer: normalizedMake,
      zipCode,
      state,
      guaranteedPrograms: universalPrograms.map(p => ({
        programName: p.programName,
        amount: p.amount,
        type: p.incentiveType,
      })),
      guaranteedSavings: `$${guaranteedSavings.toLocaleString()}`,
      maxPossibleSavings: `$${maxPossible.toLocaleString()}`,
      additionalQualifiers: [
        "Military/Veteran status",
        "First Responder credentials",
        "Recent college graduate",
        "Current vehicle brand (loyalty/conquest)",
        "Income eligibility for EV credits",
        "Existing owner referral",
      ],
      tip: "Use POST /match with full customerProfile for exact personalized savings",
    });
  } catch (err: any) {
    res.status(500).json({ error: "Quick match failed", details: err.message });
  }
});

export default router;
