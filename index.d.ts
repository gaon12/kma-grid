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
export declare class KmaGridConverter {
    #private;
    /** 부동소수점 비교용 작은 값 */
    private static readonly EPSILON;
    /** 기본 파라미터 생성 시 사용하는 기준값 */
    private static readonly DEFAULT_RE;
    private static readonly DEFAULT_GRID;
    private static readonly DEFAULT_SLAT1;
    private static readonly DEFAULT_SLAT2;
    private static readonly DEFAULT_OLON;
    private static readonly DEFAULT_OLAT;
    private static readonly DEFAULT_NX;
    private static readonly DEFAULT_NY;
    /**
     * 파라미터를 생략하면 기상청 기본값을 사용합니다.
     * 일부만 덮어쓰고 싶으면 필요한 값만 넘기면 됩니다.
     */
    constructor(params?: Partial<KmaGridParameters>);
    /** 외부에서 현재 파라미터를 읽을 수 있도록 공개합니다. */
    get params(): Readonly<KmaGridParameters>;
    /**
     * 위경도를 기상청 API용 정수 격자로 변환합니다.
     * x = (int)(x1 + 1.5)
     * y = (int)(y1 + 1.5)
     */
    toGrid(latitude: number, longitude: number): GridCoordinates;
    /**
     * 위경도를 반올림 전의 실수 격자로 변환합니다.
     *
     * 내부 계산 결과를 그대로 확인하고 싶을 때 사용합니다.
     * 기상청 API 호출에는 일반적으로 toGrid()를 사용하는 것이 맞습니다.
     */
    toGridRaw(latitude: number, longitude: number): RawGridCoordinates;
    /**
     * 기상청 API에서 사용하는 정수 격자(X, Y)를 위경도로 변환합니다.
     *
     * 역변환 전에
     * x1 = x - 1
     * y1 = y - 1
     * 를 적용합니다.
     */
    toLatLng(x: number, y: number): LatLng;
    /** 현재 설정된 격자 범위 안에 있는지 검사합니다. */
    isValidGrid(x: number, y: number): boolean;
    /** 기본 파라미터를 공개하고 싶을 때 사용할 수 있는 정적 헬퍼입니다. */
    static getDefaultParameters(): Readonly<KmaGridParameters>;
    /** 위도 검증 */
    private static assertLatitude;
    /** 경도 검증 */
    private static assertLongitude;
    /** 위경도 한 쌍을 한 번에 검증합니다. */
    static validateLatLng(latitude: number, longitude: number): void;
    /** 숫자가 유한한 값인지 검사 */
    private static assertFiniteNumber;
    /** 정수인지 검사 */
    private static assertInteger;
    /** 역변환 시 기상청 격자 범위 검사 */
    private assertGridRange;
    /**
     * 사용자 파라미터와 기본 파라미터를 합칩니다.
     * xo, yo는 grid와 연동되는 값이라서 단순 spread가 아니라 계산식으로 보정합니다.
     */
    private static mergeParams;
    /**
     * Lambert projection에서 반복 사용되는 상수들을 미리 계산합니다.
     * 매 호출마다 sn/sf/ro를 다시 계산하지 않기 때문에 더 효율적입니다.
     */
    private static createContext;
}
/**
 * 기본 설정을 사용하는 재사용 가능한 싱글턴 인스턴스입니다.
 * 대부분의 경우 이 인스턴스 하나로 충분합니다.
 */
export declare const kmaGridConverter: KmaGridConverter;
/**
 * 기존 라이브러리 사용성을 어느 정도 유지하기 위한 호환 래퍼 클래스입니다.
 *
 * 변경점
 * - 기존 getter는 호출할 때마다 전체 계산을 다시 했지만,
 *   이 버전은 한 번 계산한 정수 격자를 캐시합니다.
 * - gridX / gridY는 기상청 API에 바로 넣을 수 있는 정수 격자를 반환합니다.
 * - 반올림 전 실수 격자가 필요하면 rawGrid를 사용하면 됩니다.
 */
declare class Coordinate {
    #private;
    /** 입력 위도 */
    readonly latitude: number;
    /** 입력 경도 */
    readonly longitude: number;
    constructor(latitude: number, longitude: number);
    /** 기상청 API용 정수 격자 전체 */
    get grid(): GridCoordinates;
    /** 기존 API 스타일을 유지하는 X getter */
    get gridX(): number;
    /** 기존 API 스타일을 유지하는 Y getter */
    get gridY(): number;
    /** 반올림 전의 실수 격자 */
    get rawGrid(): RawGridCoordinates;
    /** 위경도 -> 정수 격자 정적 헬퍼 */
    static toGrid(latitude: number, longitude: number): GridCoordinates;
    /** 위경도 -> 실수 격자 정적 헬퍼 */
    static toGridRaw(latitude: number, longitude: number): RawGridCoordinates;
    /** 정수 격자 -> 위경도 정적 헬퍼 */
    static toLatLng(x: number, y: number): LatLng;
}
export default Coordinate;
