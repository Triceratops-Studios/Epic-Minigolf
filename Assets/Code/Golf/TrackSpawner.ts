import { Asset } from "@Easy/Core/Shared/Asset";
import TrackComponent from "./TrackComponent";

export default class TrackSpawner extends AirshipBehaviour {
	static getTracks(): GameObject[] {

		let index = 1;
		const tracks: GameObject[] = [];
		while (true) {
        	const asset = Asset.LoadAsset<GameObject>(`Resources/Tracks/Track${index}.prefab`);
        	if (!asset) break;
        	tracks.push(asset);
        	index++;
    	}
		return tracks;
	}

	static getTrackInfo(track: number | GameObject): { name: string, difficulty: number } | undefined {
		if (typeIs(track, "number")) {
			track = this.getTracks()[track + 1];
		}

		if (!track) {return}

		const info = track.GetAirshipComponent<TrackComponent>();
		if (!info) {return}

		return {
			name: info.name,
			difficulty: info.difficulty //1 - easy, 2 - neutral, 3 - medium, 4 - hard, 5 - extreme
		};
	}

	static spawnTrack(track: number | GameObject): GameObject | undefined {
		if (typeIs(track, "number")) {
			track = this.getTracks()[track + 1];
		}

		if (!track) {return}
		track = Instantiate(track);
		return track;
	}
}
