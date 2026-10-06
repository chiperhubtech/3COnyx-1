import { describe, expect, it } from "vitest";
import {
  normalizeMarketCheckListing,
  marketCheckSearchParams,
  parseMarketCheckSearch,
  parseMarketCheckQuery,
} from "../routes/marketcheck";

describe("MarketCheck search contract", () => {
  it("coerces bounded paging inputs and applies contract defaults", () => {
    expect(parseMarketCheckQuery({ rows: "25", start: "10", sort_by: "miles", sort_order: "desc" })).toMatchObject({
      rows: 25,
      start: 10,
      sort_by: "miles",
      sort_order: "desc",
      wholesale_only: "false",
    });
  });

  it("rejects unapproved sorts and inverted price bounds", () => {
    expect(() => parseMarketCheckQuery({ sort_by: "dealer_name" })).toThrow();
    expect(() => parseMarketCheckQuery({ price_min: "90000", price_max: "10000" })).toThrow();
  });

  it("normalizes provider records and removes unsafe media URLs", () => {
    const listing = normalizeMarketCheckListing({
      id: " provider-id ",
      year: "2023",
      price: "95000",
      mileage: "1200",
      make: " Example\u0000 ",
      model: " Coupe ",
      vin: "wp0cb2a91ns225481",
      media: { photo_links: ["https://images.example/car.jpg", "javascript:alert(1)"] },
      seller: { name: " Dealer ", phone: " 555-0100 ", website: "https://dealer.example/" },
      vdp_url: "https://dealer.example/vehicle/1",
      market_avg: 200000,
      club_price: 180000,
      wholesale_potential: true,
      unexpectedProviderField: "must not be exposed",
    });

    expect(listing).toEqual(expect.objectContaining({
      id: "provider-id",
      make: "Example",
      miles: 1200,
      vin: "WP0CB2A91NS225481",
      media: { photo_links: ["https://images.example/car.jpg"] },
      seller: expect.objectContaining({ name: "Dealer" }),
    }));
    expect(listing).not.toHaveProperty("unexpectedProviderField");
    expect(listing).not.toHaveProperty("market_avg");
    expect(listing).not.toHaveProperty("club_price");
    expect(listing).not.toHaveProperty("wholesale_potential");
    expect(listing).toMatchObject({
      seller: { phone: "555-0100", website: "https://dealer.example/" },
      vdp_url: "https://dealer.example/vehicle/1",
    });
  });

  it("retains safe seller contact and VDP links while dropping unsafe URLs", () => {
    const listing = normalizeMarketCheckListing({
      id: "listing-2",
      year: 2024,
      price: 42000,
      miles: 900,
      make: "Example",
      model: "EV",
      vdp_url: "https://dealer.example/vehicle/2",
      seller: {
        name: "Example Dealer",
        phone: "555-0100",
        website: "javascript:alert(1)",
      },
    });
    expect(listing).toMatchObject({
      vdp_url: "https://dealer.example/vehicle/2",
      seller: { name: "Example Dealer", phone: "555-0100" },
    });
    expect(listing?.seller).not.toHaveProperty("website");
  });

  it("drops provider records missing required market values", () => {
    expect(normalizeMarketCheckListing({ year: 2023, make: "Example", model: "Coupe" })).toBeNull();
  });

  it("maps price and mileage limits to provider ranges", () => {
    const params = marketCheckSearchParams({
      rows: 3, start: 0, sort_by: "price", sort_order: "asc", wholesale_only: "false",
      price_min: 10000, price_max: 20000, miles_max: 50000,
    }, "test-placeholder");
    expect(params.get("price_range")).toBe("10000-20000");
    expect(params.get("miles_range")).toBe("0-50000");
    expect(params.has("price_min")).toBe(false);
    expect(params.has("price_max")).toBe(false);
    expect(params.has("miles_max")).toBe(false);
  });

  it("normalizes MarketCheck v2 nested build and dealer records", () => {
    expect(normalizeMarketCheckListing({
      id: "nested-provider-listing",
      price: 18500,
      miles: 48600,
      build: { year: 2024, make: "Toyota", model: "Camry", trim: "LE", fuel_type: "Unleaded" },
      dealer: { name: "Example Dealer", city: "Miami", state: "fl", phone: "555-0100", website: "https://dealer.example/" },
      media: { photo_links: ["https://images.example/car.jpg"] },
    })).toMatchObject({
      year: 2024, make: "Toyota", model: "Camry", trim: "LE",
      price: 18500, miles: 48600, fuel_type: "Unleaded",
      city: "Miami", state: "FL",
      seller: { name: "Example Dealer", phone: "555-0100", website: "https://dealer.example/" },
    });
    expect(normalizeMarketCheckListing({
      price: 10000, miles: 100, build: { year: 2024, make: "Toyota" },
    })).toBeNull();
  });

  it("extracts useful documented provider filters from free text", () => {
    expect(parseMarketCheckSearch("2022 Porsche 911 Carrera")).toEqual({
      year: 2022,
      make: "Porsche",
      model: "911 Carrera",
    });
  });
});