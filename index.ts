export interface LatLng {
    /** 위도 (degree) */
    latitude: number;
    /** 경도 (degree) */
    longitude: number;
}

export interface GridCoordinates {
    /** 기상청 API가 요구하는 정수 격자 X 좌표 */
    x: number;
    /** 기상청 API가 요구하는 정수 격자 Y 좌표 */
    y: number;
}

export interface RawGridCoordinates {
    /** 반올림 전의 실수 격자 X 좌표 */
    x: number;
    /** 반올림 전의 실수 격자 Y 좌표 */
    y: number;
}

export interface KmaGridParameters {
    /** 사용할 지구반경 [km] */
    re: number;
    /** 격자간격 [km] */
    grid: number;
    /** 표준위도 1 [degree] */
    slat1: number;
    /** 표준위도 2 [degree] */
    slat2: number;
    /** 기준점 경도 [degree] */
    olon: number;
    /** 기준점 위도 [degree] */
    olat: number;
    /** 기준점 X 좌표 [grid] */
    xo: number;
    /** 기준점 Y 좌표 [grid] */
    yo: number;
    /** 기상청 단기예보 격자 X 최대값 */
    nx: number;
    /** 기상청 단기예보 격자 Y 최대값 */
    ny: number;
}

interface ProjectionContext {
    /** 원본 파라미터 */
    readonly params: Readonly<KmaGridParameters>;
    /** 도 단위를 라디안으로 바꾸기 위한 상수 */
    readonly degToRad: number;
    /** 라디안을 도 단위로 바꾸기 위한 상수 */
    readonly radToDeg: number;
    /** 계산용 반경 (re / grid) */
    readonly re: number;
    /** 표준위도1 [rad] */
    readonly slat1Rad: number;
    /** 표준위도2 [rad] */
    readonly slat2Rad: number;
    /** 기준점 경도 [rad] */
    readonly olonRad: number;
    /** 기준점 위도 [rad] */
    readonly olatRad: number;
    /** Lambert projection 상수 sn */
    readonly sn: number;
    /** Lambert projection 상수 sf */
    readonly sf: number;
    /** Lambert projection 상수 ro */
    readonly ro: number;
}

export class KmaGridConverter {
    /** 부동소수점 비교용 작은 값 */
    private static readonly EPSILON = 1e-12;

    /** 기본 파라미터 생성 시 사용하는 기준값 */
    private static readonly DEFAULT_RE = 6371.00877;
    private static readonly DEFAULT_GRID = 5.0;
    private static readonly DEFAULT_SLAT1 = 30.0;
    private static readonly DEFAULT_SLAT2 = 60.0;
    private static readonly DEFAULT_OLON = 126.0;
    private static readonly DEFAULT_OLAT = 38.0;
    private static readonly DEFAULT_NX = 149;
    private static readonly DEFAULT_NY = 253;

    /** 현재 변환기에 적용된 파라미터 */
    readonly #params: Readonly<KmaGridParameters>;

    /** 현재 파라미터로 미리 계산한 투영 상수 묶음 */
    readonly #context: ProjectionContext;

    /**
     * 파라미터를 생략하면 기상청 기본값을 사용합니다.
     * 일부만 덮어쓰고 싶으면 필요한 값만 넘기면 됩니다.
     */
    constructor(params: Partial<KmaGridParameters> = {}) {
        const mergedParams = KmaGridConverter.mergeParams(params);

        this.#params = Object.freeze(mergedParams);
        this.#context = KmaGridConverter.createContext(this.#params);
    }

    /** 외부에서 현재 파라미터를 읽을 수 있도록 공개합니다. */
    public get params(): Readonly<KmaGridParameters> {
        return this.#params;
    }

    /**
     * 위경도를 기상청 API용 정수 격자로 변환합니다.
     * x = (int)(x1 + 1.5)
     * y = (int)(y1 + 1.5)
     */
    public toGrid(latitude: number, longitude: number): GridCoordinates {
        KmaGridConverter.assertLatitude(latitude);
        KmaGridConverter.assertLongitude(longitude);

        const raw = this.toGridRaw(latitude, longitude);

        return {
            x: Math.floor(raw.x + 1.5),
            y: Math.floor(raw.y + 1.5),
        };
    }

    /**
     * 위경도를 반올림 전의 실수 격자로 변환합니다.
     *
     * 내부 계산 결과를 그대로 확인하고 싶을 때 사용합니다.
     * 기상청 API 호출에는 일반적으로 toGrid()를 사용하는 것이 맞습니다.
     */
    public toGridRaw(latitude: number, longitude: number): RawGridCoordinates {
        KmaGridConverter.assertLatitude(latitude);
        KmaGridConverter.assertLongitude(longitude);

        const ctx = this.#context;
        const PI = Math.PI;

        let theta = longitude * ctx.degToRad - ctx.olonRad;

        if (theta > PI) {
            theta -= 2.0 * PI;
        }
        if (theta < -PI) {
            theta += 2.0 * PI;
        }

        theta *= ctx.sn;

        const ra =
            (ctx.re * ctx.sf) /
            Math.pow(Math.tan(PI * 0.25 + latitude * ctx.degToRad * 0.5), ctx.sn);

        return {
            x: ra * Math.sin(theta) + ctx.params.xo,
            y: ctx.ro - ra * Math.cos(theta) + ctx.params.yo,
        };
    }

    /**
     * 기상청 API에서 사용하는 정수 격자(X, Y)를 위경도로 변환합니다.
     *
     * 역변환 전에
     * x1 = x - 1
     * y1 = y - 1
     * 를 적용합니다.
     */
    public toLatLng(x: number, y: number): LatLng {
        KmaGridConverter.assertFiniteNumber(x, "x");
        KmaGridConverter.assertFiniteNumber(y, "y");
        KmaGridConverter.assertInteger(x, "x");
        KmaGridConverter.assertInteger(y, "y");
        this.assertGridRange(x, y);

        const ctx = this.#context;
        const PI = Math.PI;

        /** 공식 C 예제와 동일하게 역변환 전에 1을 빼서 계산합니다. */
        const xOnMap = x - 1;
        const yOnMap = y - 1;

        const xn = xOnMap - ctx.params.xo;
        const yn = ctx.ro - yOnMap + ctx.params.yo;

        let ra = Math.sqrt(xn * xn + yn * yn);

        /**
         * 공식 예제의 구조를 유지하되,
         * TypeScript에서는 실제로 값이 바뀌도록 명시적으로 대입합니다.
         */
        if (ctx.sn < 0.0) {
            ra = -ra;
        }

        /**
         * 극단적으로 ra가 0에 가까우면 분모가 0이 되어 불안정해질 수 있습니다.
         * 실제 기상청 격자 범위에서는 거의 발생하지 않지만,
         * 안전하게 기준 경도를 사용하도록 처리합니다.
         */
        if (Math.abs(ra) < KmaGridConverter.EPSILON) {
            return {
                latitude: 90.0,
                longitude: ctx.params.olon,
            };
        }

        let alat = Math.pow((ctx.re * ctx.sf) / ra, 1.0 / ctx.sn);
        alat = 2.0 * Math.atan(alat) - PI * 0.5;

        /**
         * 0 나누기/부호 경계를 피하기 위해 분기를 두고 있지만,
         * Math.atan2(xn, yn)을 사용하면 동일한 의미를 더 안전하고 간결하게 표현할 수 있습니다.
         */
        const theta =
            Math.abs(xn) < KmaGridConverter.EPSILON && Math.abs(yn) < KmaGridConverter.EPSILON
                ? 0.0
                : Math.atan2(xn, yn);

        const alon = theta / ctx.sn + ctx.olonRad;

        return {
            latitude: alat * ctx.radToDeg,
            longitude: alon * ctx.radToDeg,
        };
    }

    /** 현재 설정된 격자 범위 안에 있는지 검사합니다. */
    public isValidGrid(x: number, y: number): boolean {
        return (
            Number.isInteger(x) &&
            Number.isInteger(y) &&
            x >= 1 &&
            x <= this.#params.nx &&
            y >= 1 &&
            y <= this.#params.ny
        );
    }

    /** 기본 파라미터를 공개하고 싶을 때 사용할 수 있는 정적 헬퍼입니다. */
    public static getDefaultParameters(): Readonly<KmaGridParameters> {
        return Object.freeze(KmaGridConverter.mergeParams({}));
    }

    /** 위도 검증 */
    private static assertLatitude(latitude: number): void {
        KmaGridConverter.assertFiniteNumber(latitude, "latitude");

        if (latitude < -90 || latitude > 90) {
            throw new RangeError("latitude는 -90 이상 90 이하여야 합니다.");
        }
    }

    /** 경도 검증 */
    private static assertLongitude(longitude: number): void {
        KmaGridConverter.assertFiniteNumber(longitude, "longitude");

        if (longitude < -180 || longitude > 180) {
            throw new RangeError("longitude는 -180 이상 180 이하여야 합니다.");
        }
    }

    /** 위경도 한 쌍을 한 번에 검증합니다. */
    public static validateLatLng(latitude: number, longitude: number): void {
        KmaGridConverter.assertLatitude(latitude);
        KmaGridConverter.assertLongitude(longitude);
    }

    /** 숫자가 유한한 값인지 검사 */
    private static assertFiniteNumber(value: number, name: string): void {
        if (!Number.isFinite(value)) {
            throw new TypeError(`${name}는 유한한 number여야 합니다.`);
        }
    }

    /** 정수인지 검사 */
    private static assertInteger(value: number, name: string): void {
        if (!Number.isInteger(value)) {
            throw new TypeError(`${name}는 정수여야 합니다.`);
        }
    }

    /** 역변환 시 기상청 격자 범위 검사 */
    private assertGridRange(x: number, y: number): void {
        if (!this.isValidGrid(x, y)) {
            throw new RangeError(
                `격자 범위를 벗어났습니다. x는 1~${this.#params.nx}, y는 1~${this.#params.ny} 범위여야 합니다.`,
            );
        }
    }

    /**
     * 사용자 파라미터와 기본 파라미터를 합칩니다.
     * xo, yo는 grid와 연동되는 값이라서 단순 spread가 아니라 계산식으로 보정합니다.
     */
    private static mergeParams(params: Partial<KmaGridParameters>): KmaGridParameters {
        const grid = params.grid ?? KmaGridConverter.DEFAULT_GRID;

        return {
            re: params.re ?? KmaGridConverter.DEFAULT_RE,
            grid,
            slat1: params.slat1 ?? KmaGridConverter.DEFAULT_SLAT1,
            slat2: params.slat2 ?? KmaGridConverter.DEFAULT_SLAT2,
            olon: params.olon ?? KmaGridConverter.DEFAULT_OLON,
            olat: params.olat ?? KmaGridConverter.DEFAULT_OLAT,
            xo: params.xo ?? 210 / grid,
            yo: params.yo ?? 675 / grid,
            nx: params.nx ?? KmaGridConverter.DEFAULT_NX,
            ny: params.ny ?? KmaGridConverter.DEFAULT_NY,
        };
    }

    /**
     * Lambert projection에서 반복 사용되는 상수들을 미리 계산합니다.
     * 매 호출마다 sn/sf/ro를 다시 계산하지 않기 때문에 더 효율적입니다.
     */
    private static createContext(params: Readonly<KmaGridParameters>): ProjectionContext {
        const PI = Math.PI;
        const degToRad = PI / 180.0;
        const radToDeg = 180.0 / PI;

        const re = params.re / params.grid;
        const slat1Rad = params.slat1 * degToRad;
        const slat2Rad = params.slat2 * degToRad;
        const olonRad = params.olon * degToRad;
        const olatRad = params.olat * degToRad;

        let sn = Math.tan(PI * 0.25 + slat2Rad * 0.5) / Math.tan(PI * 0.25 + slat1Rad * 0.5);
        sn = Math.log(Math.cos(slat1Rad) / Math.cos(slat2Rad)) / Math.log(sn);

        let sf = Math.tan(PI * 0.25 + slat1Rad * 0.5);
        sf = (Math.pow(sf, sn) * Math.cos(slat1Rad)) / sn;

        let ro = Math.tan(PI * 0.25 + olatRad * 0.5);
        ro = (re * sf) / Math.pow(ro, sn);

        return Object.freeze({
            params,
            degToRad,
            radToDeg,
            re,
            slat1Rad,
            slat2Rad,
            olonRad,
            olatRad,
            sn,
            sf,
            ro,
        });
    }
}

/**
 * 기본 설정을 사용하는 재사용 가능한 싱글턴 인스턴스입니다.
 * 대부분의 경우 이 인스턴스 하나로 충분합니다.
 */
export const kmaGridConverter = new KmaGridConverter();

/**
 * 기존 라이브러리 사용성을 어느 정도 유지하기 위한 호환 래퍼 클래스입니다.
 *
 * 변경점
 * - 기존 getter는 호출할 때마다 전체 계산을 다시 했지만,
 *   이 버전은 한 번 계산한 정수 격자를 캐시합니다.
 * - gridX / gridY는 기상청 API에 바로 넣을 수 있는 정수 격자를 반환합니다.
 * - 반올림 전 실수 격자가 필요하면 rawGrid를 사용하면 됩니다.
 */
class Coordinate {
    /** 입력 위도 */
    public readonly latitude: number;

    /** 입력 경도 */
    public readonly longitude: number;

    /** 정수 격자 캐시 */
    #gridCache: GridCoordinates | null = null;

    /** 실수 격자 캐시 */
    #rawGridCache: RawGridCoordinates | null = null;

    constructor(latitude: number, longitude: number) {
        KmaGridConverter.validateLatLng(latitude, longitude);

        this.latitude = latitude;
        this.longitude = longitude;
    }

    /** 기상청 API용 정수 격자 전체 */
    public get grid(): GridCoordinates {
        if (this.#gridCache === null) {
            this.#gridCache = kmaGridConverter.toGrid(this.latitude, this.longitude);
        }

        return this.#gridCache;
    }

    /** 기존 API 스타일을 유지하는 X getter */
    public get gridX(): number {
        return this.grid.x;
    }

    /** 기존 API 스타일을 유지하는 Y getter */
    public get gridY(): number {
        return this.grid.y;
    }

    /** 반올림 전의 실수 격자 */
    public get rawGrid(): RawGridCoordinates {
        if (this.#rawGridCache === null) {
            this.#rawGridCache = kmaGridConverter.toGridRaw(this.latitude, this.longitude);
        }

        return this.#rawGridCache;
    }

    /** 위경도 -> 정수 격자 정적 헬퍼 */
    public static toGrid(latitude: number, longitude: number): GridCoordinates {
        return kmaGridConverter.toGrid(latitude, longitude);
    }

    /** 위경도 -> 실수 격자 정적 헬퍼 */
    public static toGridRaw(latitude: number, longitude: number): RawGridCoordinates {
        return kmaGridConverter.toGridRaw(latitude, longitude);
    }

    /** 정수 격자 -> 위경도 정적 헬퍼 */
    public static toLatLng(x: number, y: number): LatLng {
        return kmaGridConverter.toLatLng(x, y);
    }
}

export default Coordinate;