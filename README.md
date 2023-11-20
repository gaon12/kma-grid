# kma-grid
kma-grid는 위도와 경도를 Lambert Conformal Conic Projection을 사용하여 격자 좌표로 변환하는 자바스크립트 라이브러리입니다. 이 라이브러리는 [기상청 API](https://www.data.go.kr/data/15084084/openapi.do)에서 격자X, Y를 사용할 때 유용합니다.

기상청 API 문서 내에 C언어로 된 격자 변환 코드를 자바스크립트로 변환한 코드입니다.

## 설치
라이브러리는 npm을 사용하여 쉽게 설치할 수 있습니다:

```shell
npm install kma-grid
```

## 사용 방법
라이브러리를 사용하기 위해, `Coordinate` 클래스를 임포트하고 위도 및 경도 값을 인자로 전달하여 인스턴스를 생성합니다. 그 후, `gridX`와 `gridY` 프로퍼티를 사용하여 격자 좌표를 얻을 수 있습니다.

```javascript
import Coordinate from 'kma-grid'

const coord = new Coordinate(37.565, 126.9780);

console.log('Grid X:', coord.gridX);
console.log('Grid Y:', coord.gridY);
```

## API
### `new Coordinate(latitude, longitude)`
- `latitude` (Number) - 위도 (degrees)
- `longitude` (Number) - 경도 (degrees)

### `Coordinate.gridX`
- 격자 X 좌표를 반환합니다.

### `Coordinate.gridY`
- 격자 Y 좌표를 반환합니다.

## 라이선스
이 프로젝트는 MIT 라이선스를 사용합니다. 라이선스에 대한 자세한 정보는 라이선스 파일을 참고해주세요.

## 기여
기여를 원하시면, 프로젝트의 GitHub 저장소에 pull request를 보내주시거나 이슈를 등록해주세요.
