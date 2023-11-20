class Coordinate {
    // Private 필드로 선언
    #map = {
        Re: 6371.00877, 
        grid: 5.0, 
        slat1: 30.0, 
        slat2: 60.0, 
        olon: 126.0, 
        olat: 38.0, 
        xo: 210 / 5.0, 
        yo: 675 / 5.0, 
        first: 0
    };

    constructor(latitude, longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }

    get gridX() {
        return this.lamcproj(this.latitude, this.longitude).x;
    }

    get gridY() {
        return this.lamcproj(this.latitude, this.longitude).y;
    }

    lamcproj(lat, lon) {
        const PI = Math.asin(1.0) * 2.0;
        const DEGRAD = PI / 180.0;
        
        let re = this.#map.Re / this.#map.grid;
        let slat1 = this.#map.slat1 * DEGRAD;
        let slat2 = this.#map.slat2 * DEGRAD;
        let olon = this.#map.olon * DEGRAD;
        let olat = this.#map.olat * DEGRAD;

        let sn = Math.tan(PI * 0.25 + slat2 * 0.5) / Math.tan(PI * 0.25 + slat1 * 0.5);
        sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
        let sf = Math.tan(PI * 0.25 + slat1 * 0.5);
        sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
        let ro = Math.tan(PI * 0.25 + olat * 0.5);
        ro = re * sf / Math.pow(ro, sn);
        
        let ra = Math.tan(PI * 0.25 + lat * DEGRAD * 0.5);
        ra = re * sf / Math.pow(ra, sn);
        let theta = lon * DEGRAD - olon;
        if (theta > PI) theta -= 2.0 * PI;
        if (theta < -PI) theta += 2.0 * PI;
        theta *= sn;

        return {
            x: ra * Math.sin(theta) + this.#map.xo,
            y: ro - ra * Math.cos(theta) + this.#map.yo
        };
    }
}

export default Coordinate;
