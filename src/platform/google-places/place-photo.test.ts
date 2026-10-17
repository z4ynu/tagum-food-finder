import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { parseGooglePlacesConfig, selectGooglePlacePhoto } from "./place-photo";

const query = {
  address: "Apokon Road",
  coordinates: { latitude: 7.447, longitude: 125.807 },
  name: "Tagum Test Cafe",
} as const;

describe("parseGooglePlacesConfig", () => {
  it("stays disabled until the server key is configured", () => {
    expect(parseGooglePlacesConfig({})).toEqual({
      reason: "missing-api-key",
      status: "disabled",
    });
  });

  it("normalizes a server-only key", () => {
    expect(parseGooglePlacesConfig({ GOOGLE_PLACES_API_KEY: " secret " })).toEqual({
      apiKey: "secret",
      status: "configured",
    });
  });
});

describe("selectGooglePlacePhoto", () => {
  it("selects a nearby name match and retains required author attribution", () => {
    expect(
      selectGooglePlacePhoto(
        {
          places: [
            {
              displayName: { text: "Tagum Test Cafe" },
              id: "google-place-1",
              location: { latitude: 7.4471, longitude: 125.8071 },
              photos: [
                {
                  authorAttributions: [
                    { displayName: "Maria D.", uri: "https://example.com/profile" },
                  ],
                  heightPx: 900,
                  name: "places/google-place-1/photos/photo_1-AbC",
                  widthPx: 1200,
                },
              ],
            },
          ],
        },
        query,
      ),
    ).toEqual({
      googlePlaceId: "google-place-1",
      photo: {
        attributions: [{ displayName: "Maria D.", uri: "https://example.com/profile" }],
        height: 900,
        name: "places/google-place-1/photos/photo_1-AbC",
        width: 1200,
      },
    });
  });

  it("rejects similarly named results that are too far from the catalog coordinates", () => {
    expect(
      selectGooglePlacePhoto(
        {
          places: [
            {
              displayName: { text: "Tagum Test Cafe" },
              id: "google-place-2",
              location: { latitude: 7.6, longitude: 125.95 },
              photos: [{ name: "places/google-place-2/photos/photo-2" }],
            },
          ],
        },
        query,
      ),
    ).toBeNull();
  });

  it("rejects nearby results whose names do not match", () => {
    expect(
      selectGooglePlacePhoto(
        {
          places: [
            {
              displayName: { text: "Completely Different Restaurant" },
              id: "google-place-3",
              location: query.coordinates,
              photos: [{ name: "places/google-place-3/photos/photo-3" }],
            },
          ],
        },
        query,
      ),
    ).toBeNull();
  });
});
