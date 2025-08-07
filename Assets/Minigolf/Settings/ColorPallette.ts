export default class ColorPallette extends AirshipBehaviour {

	static palette = [
		new Color(255/255, 63/255, 63/255, 255/255),    // Red      (#FF3F3F)
		new Color(255/255, 154/255, 0/255, 255/255),    // Orange   (#FF9A00)
		new Color(255/255, 213/255, 0/255, 255/255),    // Yellow   (#FFD500)
		new Color(0/255, 230/255, 118/255, 255/255),    // Green    (#00E676)
		new Color(31/255, 218/255, 154/255, 255/255),   // Teal     (#1FDA9A)
		new Color(0/255, 207/255, 255/255, 255/255),    // Cyan     (#00CFFF)
		new Color(63/255, 139/255, 255/255, 255/255),   // Blue     (#3F8BFF)
		new Color(155/255, 93/255, 229/255, 255/255),   // Purple   (#9B5DE5)
		new Color(255/255, 77/255, 166/255, 255/255),   // Pink     (#FF4DA6)
	];

	static random(): Color {
		const index = math.random(0, this.palette.size() - 1);
		print(index, this.palette[index])
		return this.palette[index];
	}

	static lerp3(value: number, a: number, b: number, c: number): Color {
		value = math.clamp(value, 0, 1);
		let color: Color;

		if (value <= 0.5) {
    		const t = value / 0.5;
    		color = Color.Lerp(ColorPallette.palette[a], ColorPallette.palette[b], t);
		} else {
		    const t = (value - 0.5) / 0.5;
    		color = Color.Lerp(ColorPallette.palette[b], ColorPallette.palette[c], t);
		}

		return color
	}
}
