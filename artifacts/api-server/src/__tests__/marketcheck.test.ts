import { describe, expect, it } from "vitest";
import {
  normalizeMarketCheckListing,
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

  it("extracts useful documented provider filters from free text", () => {
    expect(parseMarketCheckSearch("2022 Porsche 911 Carrera")).toEqual({
      year: 2022,
      make: "Porsche",
      model: "911 Carrera",
    });
  });
});