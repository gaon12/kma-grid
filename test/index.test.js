import assert from "node:assert/strict";
import { describe, it } from "node:test";

import Coordinate, { KmaGridConverter, kmaGridConverter } from "../index.js";

describe("KMA grid conversion", () => {
    it("matches the official KMA sample coordinate", () => {
        const grid = kmaGridConverter.toGrid(37.488201, 126.92981);

        assert.deepEqual(grid, { x: 59, y: 125 });
    });

    it("keeps the legacy Coordinate default export compatible", () => {
        const coordinate = new Coordinate(37.488201, 126.92981);

        assert.equal(coordinate.gridX, 59);
        assert.equal(coordinate.gridY, 125);
        assert.deepEqual(coordinate.grid, { x: 59, y: 125 });
        assert.equal(Coordinate.toGrid(37.488201, 126.92981).x, 59);
    });

    it("round-trips representative Korean locations back to the same grid cell", () => {
        const converter = new KmaGridConverter();
        const locations = [
            { name: "Seoul", latitude: 37.5665, longitude: 126.978 },
            { name: "Daejeon", latitude: 36.3504, longitude: 127.3845 },
            { name: "Busan", latitude: 35.1796, longitude: 129.0756 },
            { name: "Jeju", latitude: 33.4996, longitude: 126.5312 },
            { name: "Gangneung", latitude: 37.7519, longitude: 128.8761 }
        ];

        for (const location of locations) {
            const grid = converter.toGrid(location.latitude, location.longitude);
            const latLng = converter.toLatLng(grid.x, grid.y);
            const gridAgain = converter.toGrid(latLng.latitude, latLng.longitude);

            assert.deepEqual(gridAgain, grid, location.name);
        }
    });

    it("exposes raw floating-point grid coordinates for debugging", () => {
        const converter = new KmaGridConverter();
        const raw = converter.toGridRaw(37.488201, 126.92981);

        assert.equal(typeof raw.x, "number");
        assert.equal(typeof raw.y, "number");
        assert.ok(Number.isFinite(raw.x));
        assert.ok(Number.isFinite(raw.y));
    });

    it("checks KMA grid range", () => {
        const converter = new KmaGridConverter();

        assert.equal(converter.isValidGrid(59, 125), true);
        assert.equal(converter.isValidGrid(0, 125), false);
        assert.equal(converter.isValidGrid(59, 254), false);
    });

    it("throws for invalid latitude, longitude, and grid arguments", () => {
        const converter = new KmaGridConverter();

        assert.throws(() => converter.toGrid(91, 126.92981), RangeError);
        assert.throws(() => converter.toGrid(37.488201, 181), RangeError);
        assert.throws(() => converter.toLatLng(59.5, 125), TypeError);
        assert.throws(() => converter.toLatLng(150, 125), RangeError);
    });

    it("freezes converter parameters", () => {
        const converter = new KmaGridConverter();
        const defaults = KmaGridConverter.getDefaultParameters();

        assert.ok(Object.isFrozen(converter.params));
        assert.ok(Object.isFrozen(defaults));
        assert.equal(defaults.nx, 149);
        assert.equal(defaults.ny, 253);
    });
});
