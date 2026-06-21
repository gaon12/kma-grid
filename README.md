# kma-grid

`kma-grid`는 위도와 경도를 기상청 단기예보 API에서 사용하는 Lambert Conformal Conic 격자 좌표로 변환하는 JavaScript/TypeScript 라이브러리입니다.

기상청 단기예보 OpenAPI의 `nx`, `ny` 값을 만들 때 사용할 수 있습니다.

## 설치

```shell
npm install kma-grid
```

## 빠른 사용법

```javascript
import Coordinate from "kma-grid";

const coord = new Coordinate(37.488201, 126.92981);

console.log(coord.gridX); // 59
console.log(coord.gridY); // 125
console.log(coord.grid);  // { x: 59, y: 125 }
```

인자 순서는 `latitude, longitude`입니다. 즉, `위도, 경도` 순서입니다.

## 변환기 직접 사용

```javascript
import { KmaGridConverter } from "kma-grid";

const converter = new KmaGridConverter();
const grid = converter.toGrid(37.488201, 126.92981);

console.log(grid); // { x: 59, y: 125 }
```

## 역변환

기상청 격자 좌표를 다시 위경도로 바꿀 수 있습니다.

```javascript
import { KmaGridConverter } from "kma-grid";

const converter = new KmaGridConverter();
const latLng = converter.toLatLng(59, 125);

console.log(latLng);
// { latitude: 37.488201..., longitude: 126.929810... }
```

## 실수 격자 확인

반올림 전 계산 결과가 필요하면 `toGridRaw()`를 사용할 수 있습니다.

```javascript
import { KmaGridConverter } from "kma-grid";

const converter = new KmaGridConverter();
const raw = converter.toGridRaw(37.488201, 126.92981);

console.log(raw);
```

## 격자 범위 확인

```javascript
import { KmaGridConverter } from "kma-grid";

const converter = new KmaGridConverter();

console.log(converter.isValidGrid(59, 125)); // true
console.log(converter.isValidGrid(0, 125));  // false
```

## 모듈 형식

이 패키지는 ESM 패키지입니다.

```javascript
import Coordinate from "kma-grid";
import { KmaGridConverter } from "kma-grid";
```

CommonJS의 `require()` 전용 프로젝트에서는 동적 import를 사용해야 합니다.

```javascript
const { default: Coordinate, KmaGridConverter } = await import("kma-grid");
```

## API

### `new Coordinate(latitude, longitude)`

위도와 경도를 받아 좌표 객체를 만듭니다.

### `Coordinate.gridX`

기상청 API에 사용할 격자 X 좌표를 반환합니다.

### `Coordinate.gridY`

기상청 API에 사용할 격자 Y 좌표를 반환합니다.

### `Coordinate.grid`

`{ x, y }` 형태의 정수 격자 좌표를 반환합니다.

### `Coordinate.rawGrid`

반올림 전의 실수 격자 좌표를 반환합니다.

### `new KmaGridConverter(params?)`

커스텀 투영 파라미터를 사용하는 변환기를 생성합니다.

### `KmaGridConverter.toGrid(latitude, longitude)`

위경도를 기상청 정수 격자로 변환합니다.

### `KmaGridConverter.toGridRaw(latitude, longitude)`

반올림 전의 실수 격자 좌표를 반환합니다.

### `KmaGridConverter.toLatLng(x, y)`

기상청 정수 격자 좌표를 위경도로 역변환합니다.

### `KmaGridConverter.isValidGrid(x, y)`

기본 기상청 단기예보 격자 범위 기준으로 `x`, `y`가 유효한지 확인합니다.

## 개발

```shell
npm ci
npm test
npm run build
npm run pack:check
```

## 라이선스

MIT License
